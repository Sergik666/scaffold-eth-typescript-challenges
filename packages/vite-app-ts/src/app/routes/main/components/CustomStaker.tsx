import { EtherscanProvider, StaticJsonRpcProvider } from '@ethersproject/providers';
import { transactor, TTransactor } from 'eth-components/functions';
import { useBalance, useContractLoader, useEventListener, useGasPrice, useOnRepetition } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import React, { FC, useContext, useEffect, useState } from 'react';
import { useAppContracts } from '../hooks/useAppContracts';
import { Staker as StakerContract, ExampleExternalContract } from '~~/generated/contract-types';
import { Button, List } from 'antd';
import { Address, Balance } from 'eth-components/ant';
import { formatEther, parseEther } from '@ethersproject/units';
import { BigNumber } from 'ethers';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { ethers } from 'ethers';
import { EthComponentsSettingsContext } from 'eth-components/models';
import { useDexEthPrice } from 'eth-hooks/dapps';

const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
const humanizer: HumanizeDuration = new HumanizeDuration(langService);

export interface StakerProps {
  mainnetProvider: StaticJsonRpcProvider;
}

export const CustomStaker: FC<StakerProps> = (props) => {
  const { mainnetProvider } = props;

  const appContractConfig = useAppContracts();
  const ethersContext = useEthersContext();
  const readContracts = useContractLoader(appContractConfig);
  const writeContracts = useContractLoader(appContractConfig, ethersContext?.signer);

  const yourCurrentBalance = useBalance(ethersContext.account ?? '');

  const stakeContractRead = readContracts['Staker'] as StakerContract;
  const stakeContractWrite = writeContracts['Staker'] as StakerContract;
  const externalContractRead = readContracts['ExampleExternalContract'] as ExampleExternalContract;

  const ethComponentsSettings = useContext(EthComponentsSettingsContext);
  const gasPrice = useGasPrice(ethersContext.chainId, 'fast');
  const ethPrice = useDexEthPrice(mainnetProvider);
  const tx = transactor(ethComponentsSettings, ethersContext?.signer, gasPrice);

  const [threshold, setThreshold] = useState<BigNumber>();
  useEffect(() => {
    const getThreshold = async () => {
      const threshold = await stakeContractRead?.threshold();
      console.log('💵 threshold:', threshold);
      setThreshold(threshold);
    };
    getThreshold();
  }, [yourCurrentBalance]);

  const [balanceStaked, setBalanceStaked] = useState<BigNumber>();
  useEffect(() => {
    const getBalanceStaked = async () => {
      const balanceStaked = await stakeContractRead?.balances(ethersContext?.account ?? '');
      console.log('💵 balanceStaked:', balanceStaked);
      setBalanceStaked(balanceStaked);
    };
    getBalanceStaked();
  }, [yourCurrentBalance]);

  const [timeLeft, setTimeLeft] = useState<BigNumber>();
  useEffect(() => {
    const getTimeLeft = async () => {
      const timeLeft = await stakeContractRead?.timeLeft();
      console.log('⏳ timeLeft:', timeLeft);
      setTimeLeft(timeLeft);
    };
    getTimeLeft();
  }, [yourCurrentBalance]);

  const [completed, setCompleted] = useState<boolean>(false);
  useEffect(() => {
    const getCompleted = async () => {
      const completed = await externalContractRead?.completed();
      console.log('✅ complete:', completed);
      setCompleted(completed);
    };
    getCompleted();
  }, [yourCurrentBalance]);

  const [stakeCompleted, setStakeCompleted] = useState<boolean>(false);
  useEffect(() => {
    const getStakeCompleted = async () => {
      const completed = await stakeContractRead?.getCompleted();
      console.log('✅ stake complete:', completed);
      setStakeCompleted(completed);
    };
    getStakeCompleted();
  }, [yourCurrentBalance]);

  const [openForWithdraw, setOpenForWithdraw] = useState<boolean>(false);
  useEffect(() => {
    const getOpenForWithdraw = async () => {
      const openForWithdraw = await stakeContractRead?.getOpenForWithdraw();
      console.log('✅ open for withdraw:', openForWithdraw);
      setOpenForWithdraw(openForWithdraw);
    };
    getOpenForWithdraw();
  }, [yourCurrentBalance]);

  const [stakers, setStakers] = useState<string[]>();
  useEffect(() => {
    const getStakers = async () => {
      const stakers = await stakeContractRead?.getStakers();
      console.log('💵 threshold:', stakers);
      setStakers(stakers);
    };
    getStakers();
  }, [yourCurrentBalance]);

  // ** 📟 Listen for broadcast events
  const stakeEvents = useEventListener(stakeContractRead, 'Stake', 1);

  let completeDisplay = <></>;
  if (completed) {
    completeDisplay = (
      <div style={{ padding: 64, backgroundColor: '#eeffef', fontWeight: 'bolder' }}>
        🚀 🎖 👩‍🚀 - Staking App triggered `ExampleExternalContract` -- 🎉 🍾 🎊
        <Balance address={externalContractRead?.address} /> ETH staked!
      </div>
    );
  }

  const stakeControls = (
    <div style={{ padding: 8, marginTop: 16 }}>

      <div style={{ padding: 8 }}>
        <div>You staked:</div>
        <Balance address={undefined} balance={balanceStaked} price={ethPrice} />
      </div>

      <div style={{ padding: 8 }}>
        <Button
          type={balanceStaked ? 'primary' : 'default'}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.stake({ value: ethers.utils.parseEther('0.01') }));
            }
          }}>
          🥩 Stake 0.01 ether!
        </Button>
        <span style={{ padding: 8 }}></span>
        <Button
          type={balanceStaked ? 'primary' : 'default'}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.stake({ value: ethers.utils.parseEther('0.05') }));
            }
          }}>
          🥩 Stake 0.05 ether!
        </Button>
        <span style={{ padding: 8 }}></span>
        <Button
          type={balanceStaked ? 'primary' : 'default'}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.stake({ value: ethers.utils.parseEther('0.1') }));
            }
          }}>
          🥩 Stake 0.1 ether!
        </Button>
      </div>

    </div>
  );

  const executeButton = (
    <div style={{ padding: 8 }}>
      <Button
        type={'default'}
        onClick={() => {
          if (tx) {
            tx(stakeContractWrite.execute());
          }
        }}>
        📡 Execute!
      </Button>
    </div>
  );

  const withdrawButton = (
    <div style={{ padding: 8 }}>
      <Button
        type={'default'}
        onClick={() => {
          if (tx && ethersContext.account) {
            tx(stakeContractWrite.withdraw());
          }
        }}>
        🏧 Withdraw
      </Button>
    </div>
  );

  const timeLeftComponent = (
    <div style={{ padding: 8, marginTop: 16 }}>
      <div>Timeleft:</div>
      {timeLeft && humanizer.humanize(timeLeft.toNumber() * 1000)}
    </div>
  );

  const timeIsOverComponent = (
    <div style={{ padding: 8, marginTop: 16 }}>
      <div>Time is over</div>
    </div>
  );

  const stakeFinished = stakeCompleted || timeLeft?.eq(BigNumber.from("0"));

  return (
    <div>
      {completeDisplay}

      <div style={{ padding: 8, marginTop: 32 }}>
        <div>Staker Contract:</div>
        <Address address={stakeContractRead?.address} />
      </div>

      {stakeFinished && (openForWithdraw || completeDisplay) && (
        <div style={{ padding: 8, marginTop: 16 }}>
          For restart staking: go "Debug" - "Staker" - "restart" method
        </div>
      )}

      {stakeFinished ? timeIsOverComponent : timeLeftComponent}

      <div style={{ padding: 8, marginTop: 16 }}>
        <div>Total Staked:</div>
        <Balance address={stakeContractRead?.address} />/
        <Balance address={undefined} balance={threshold} />
      </div>

      {!stakeFinished && stakeControls}

      {stakeFinished && !openForWithdraw && executeButton}

      {openForWithdraw && withdrawButton}

      <div style={{ width: 600, margin: 'auto', marginTop: 32, paddingBottom: 32 }}>
        <h2>Stakers:</h2>
        <List
          bordered
          dataSource={stakers}
          renderItem={(item: any) => {
            return (
              <List.Item
                key={item}
                style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <Address address={item} ensProvider={mainnetProvider} fontSize={16} />
                </div>
              </List.Item>
            );
          }}
        />
      </div>

    </div>
  );
};
