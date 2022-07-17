pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import './ExampleExternalContract.sol';

error Staker__NeedMoreETHSent();
error Staker__NoStakedAmount();
error Staker__TransferFailed();
error Staker__TimeNotLeft();
error Staker__WithdrawNotAllowed();
error Staker__StakingFinished();
error Staker__StakingNotFinished();

contract Staker {
  mapping(address => uint256) public balances;
  address[] private s_stakers;
  uint256 public constant threshold = 1 ether;
  ExampleExternalContract public exampleExternalContract;

  uint256 private constant c_stakeTimeout = 72 hours;
  // uint256 private constant c_stakeTimeout = 30 seconds;

  uint256 private s_deadline = block.timestamp + c_stakeTimeout;
  bool private s_openForWithdraw;
  bool private s_completed;

  event Stake(address staker, uint256 amount);
  event Withdraw(address staker, uint256 amount);
  event Execute(bool stakingSuccess);

  constructor(address exampleExternalContractAddress) {
    exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
  }

  function stake() public payable {
    if (s_completed) {
      revert Staker__StakingFinished();
    }

    if (block.timestamp > s_deadline) {
      revert Staker__TimeNotLeft();
    }

    if (msg.value <= 0) {
      revert Staker__NeedMoreETHSent();
    }

    if (balances[msg.sender] == 0) {
      s_stakers.push(msg.sender);
    }

    balances[msg.sender] += msg.value;

    emit Stake(msg.sender, msg.value);
  }

  function withdraw() public {
    if (!s_openForWithdraw) {
      revert Staker__WithdrawNotAllowed();
    }

    uint256 balance = balances[msg.sender];
    if (balance <= 0) {
      revert Staker__NoStakedAmount();
    }

    balances[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: balance}('');
    if (!success) {
      revert Staker__TransferFailed();
    }

    emit Stake(msg.sender, balance);
  }

  function timeLeft() public view returns (uint256) {
    if (block.timestamp >= s_deadline) {
      return 0;
    }

    return s_deadline - block.timestamp;
  }

  function execute() public payable {
    if (block.timestamp < s_deadline) {
      revert Staker__TimeNotLeft();
    }

    if (s_completed) {
      revert Staker__StakingFinished();
    }

    s_completed = true;

    if (address(this).balance >= threshold) {
      exampleExternalContract.complete{value: address(this).balance}();
    } else {
      s_openForWithdraw = true;
    }

    emit Execute(!s_openForWithdraw);
  }

  function restart() public payable {
    if (!s_completed) {
      revert Staker__StakingNotFinished();
    }

    for (uint i=0; i< s_stakers.length ; i++){
        delete balances[s_stakers[i]];
    }
    delete s_stakers;

    exampleExternalContract.reset{value: address(this).balance}();

    s_deadline = block.timestamp + c_stakeTimeout;
    s_openForWithdraw = false;
    s_completed = false;
  }

  receive() external payable {
    stake();
  }

  function getStakers() public view returns (address[] memory) {
    return s_stakers;
  }

  function getCompleted() public view returns (bool) {
    return s_completed;
  }

  function getOpenForWithdraw() public view returns (bool) {
    return s_openForWithdraw;
  }
}
