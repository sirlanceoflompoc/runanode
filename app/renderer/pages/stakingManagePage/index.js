import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import SVGInline from "react-svg-inline";
import BN from "bn.js";
import { Balance, BlockNumber } from "@polkadot/types";
import { useSpring, animated } from 'react-spring'

import {
  CENNZScanAddressUrl,
  PreDefinedAssetId,
  PreDefinedAssetIdName,
} from 'common/types/cennznet-node.types';
import centrapayIcon from 'renderer/assets/icon/centrapay.svg';
import cennzIcon from 'renderer/assets/icon/cennz.svg';
import { colors } from 'renderer/theme';
import { Logger } from 'renderer/utils/logging';
import { MainContent, MainLayout } from 'components/layout';
import { Button, PageHeading } from 'components';
import withContainer from './container';
import ClipboardShareLinks from '../wallet/account/transferSectionPage/ClipboardShareLinks';
import UnStakeWarningModal from './UnStakeWarningModal';
import CennznetWallet from '../../api/wallets/CennznetWallet';
import CennznetWalletAccount from '../../api/wallets/CennznetWalletAccount';
import ChangeStakingPreferenceModal from './ChangeStakingPreferenceModal';
import useApis from '../stakingOverviewPage/useApis';
import SavePreferenceSection from './SavePreferenceSection';

const CentrapayIcon = styled(SVGInline).attrs({
  svg: centrapayIcon,
})`
  width: auto;
`;

const CennzIcon = styled(SVGInline).attrs({
  svg: cennzIcon,
})`
  width: auto;
`;

const UnStakeButton = styled(Button)`
  position: absolute;
  right: 0rem;
`;

const SectionLayoutWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
`;

const SectionLayoutInnerWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 70%;
  height: 30rem;
`;

const Right = styled.div`
  width: 30%;
  padding: 0rem 0rem 0rem 1rem;
`;

const ItemTitle = styled.div`
  color: ${colors.textMuted};
  line-height: 1.8rem;;
`;

const ItemNum = styled.span`
  font-size: 1.8rem;
`;

const Item = styled.div`
  background-color: ${colors.V900};
  border-radius: 3px;
  padding: 1rem 1rem 1rem 1rem;
  line-height: 1.5rem;
  &+& {
    margin-top: 1rem;
  }
`;

const WarningContent = styled.div`
  color: ${colors.warning};
`;

const PunishmentContent = styled.div`
  color: ${colors.danger};
`;

const RewardContent = styled.div`
  color: ${colors.success};
`;

const InnerSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 2rem 2rem 2rem;
  background-color: ${colors.V900};
  border-radius: 3px;
  width: 45%;
`;

const InnerSectionItem = styled.div`
  margin-top: 1rem;
`;

const fadeIn = keyframes`
  from {
    transform: scale(.25);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    transform: scale(1);
    opacity: 1;
  }

  to {
    transform: scale(.25);
    opacity: 0;
  }
`;
const InnerSectionItemDiff = styled(InnerSectionItem)`
  color: ${p => p.children < 0 ? colors.danger : colors.success };
  visibility: ${p => p.children === '0' ? 'hidden' : 'visible'};
  animation: ${p => p.children === '0' ? fadeOut : fadeIn} 1s linear;
  transition: visibility 1s linear;
`;

const InnerSectionItemNum = styled(InnerSectionItem)`
  font-size: 1.8rem;
`;

const InnerSectionItemIcon = styled(InnerSectionItem)`
  height: 40px;
`;

const SectionHDivider = styled.div`
  width: 10%;
`;

const Subheading = ({ account, wallet }) => {
  const url = CENNZScanAddressUrl.rimu; // TODO should base on selected network
  const { name: walletName } = wallet;
  const { name: accountName } = account;
  return (
    <div style={{ display: 'flex' }}>
      <span>Staking account:{walletName || 'N/A'}:{accountName || 'N/A'}:</span>
      <ClipboardShareLinks
        url={url}
        styles={{
          height: '1rem',
          lineHeight: '1rem',
          padding: null,
          backgroundColor: null,
          textDecoration: null,
          icon2MarginLeft: '1rem',
          textPaddingTop: null,
          textMinWidth: null,
        }}>
        {account.address}
      </ClipboardShareLinks>
    </div>
  );
};

const StakingStakePage = ({ subNav, onUnStake, onSaveStakingPreferences }) => {

  const [warningValue, setWarningValue] = useState(0);
  const [punishmentValue, setPunishmentValue] = useState(0);
  const [rewardValue, setRewardValue] = useState('0');
  const [rewardValueDiff, setRewardValueDiff] = useState('0');
  const [rewardSpendingValue, setRewardSpendingValue] = useState('0');
  const [rewardSpendingValueDiff, setRewardSpendingValueDiff] = useState('0');

  // TODO fetch from saved stake account value
  const stakingWallet: CennznetWallet = window.odin.store.getState().localStorage.WALLETS[0];
  const stakingAccountAddress = Object.keys(window.odin.store.getState().localStorage.WALLETS[0].accounts)[0];
  const stakingAccount: CennznetWalletAccount = window.odin.store.getState().localStorage.WALLETS[0].accounts[stakingAccountAddress];

  const [intentions, validators, validatorPreferences] = useApis(
    'getIntentions',
    'getValidators',
    [
      'getValidatorPreferences',
      { noSubscription: false, params: [stakingAccountAddress] },
    ],
  );

  //TODO for demo only
  const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
  }
  useEffect(() => {
    const interval = setTimeout(() => {
      const val = getRandomInt(10);
      setRewardSpendingValue(value => new BN(value, 10).add(new BN(val)).toString(10));
      setRewardSpendingValueDiff(new BN(val).toString(10));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [rewardSpendingValue, rewardSpendingValueDiff]);

  const callbackFn = value => {
    if(Array.isArray(value)) {
      // for system events
      if(value.Type && value.Type === 'EventRecord') {
        value
          .filter(({ event }) => event.section !== 'system')
          .filter((record) => record.event) // event.section !== 'system')
          .map(({ event }, index) => {
            const {  method, section } = event;
            const document = event.meta && event.meta.documentation
              ? event.meta.documentation.join(' ')
              : '';
            const defaultType = event.data.typeDef[0].type;
            const defaultData = event.data.toArray()[0];
            if(`${section}.${method}` === 'staking.Reward') {
              const balance: Balance = defaultData;
              const balanceValue = balance.toString() === '0' ? '3' : balance.toString(); // TODO DEMO only, after stake balance become 0
              Logger.debug(`balanceValue: ${balanceValue}`);
              setRewardValue(myValue => new BN(myValue, 10).add(new BN(balanceValue, 10).div(new BN(3))).toString(10));
              setRewardValueDiff(new BN(balanceValue.toString(), 10).div(new BN(3)).toString(10));
            }
            // if(`${section}.${method}` === 'session.NewSession') {
            //   const blockNumber: BlockNumber = defaultData;
            // }
            // if(`${section}.${method}` === 'staking.OfflineWarning') {
            // }
            // if(`${section}.${method}` === 'staking.OfflineSlash') {
            // }
            return defaultData;
          });
      }
    }
    return value;
  };

  // handle system event effect
  useEffect(() => {
    let unsubscribeFn;
    window.odin.api.cennz.getSystemEvents(callbackFn)
      .then(value => {
        unsubscribeFn = value;
      });
    // useEffect clean up
    return () => {
      if(unsubscribeFn) {
        unsubscribeFn();
      }
    };
  },[]);



  const intentionsIndex = intentions ? intentions.indexOf(stakingAccount.address) : -1;
  const [isUnStakeWarningModalOpen, setUnStakeWarningModalOpen] = useState(false);
  const [isChangeStakingPreferenceModalOpen, setChangeStakingPreferenceModalOpen] = useState(false);

  const AnimatedInnerSectionItemDiff = ({value}) => {
    const props = useSpring({ opacity: 1, from: { opacity: 0 } });
    return (
      <animated.div style={props}>
        <InnerSectionItemDiff>{value > 0 ? '+ ' + value : value }</InnerSectionItemDiff>
      </animated.div>
    );
  };

  return (
    <MainLayout subNav={subNav}>
      <MainContent display="flex">
        <UnStakeButton color="danger" onClick={() => setUnStakeWarningModalOpen(true)}>Unstake</UnStakeButton>
        <PageHeading
          subHeading={<Subheading {...{ account: stakingAccount, wallet: stakingWallet }} />}>
          Manage Staking
        </PageHeading>
        <div className="content">
          <SectionLayoutWrapper>
            <Left>
              <SectionLayoutInnerWrapper>
                <InnerSectionWrapper>
                  <ItemTitle>Stake balance</ItemTitle>
                  <InnerSectionItemIcon>
                    <CennzIcon />
                  </InnerSectionItemIcon>
                  <InnerSectionItem>{PreDefinedAssetIdName[PreDefinedAssetId.stakingToken]}</InnerSectionItem>
                  <InnerSectionItemNum>{stakingAccount.assets[PreDefinedAssetId.stakingToken].totalBalance.toString}</InnerSectionItemNum>
                  <InnerSectionItem>Reserved: {stakingAccount.assets[PreDefinedAssetId.stakingToken].reservedBalance.toString}</InnerSectionItem>
                  <InnerSectionItem>Total: {stakingAccount.assets[PreDefinedAssetId.stakingToken].totalBalance.toString}</InnerSectionItem>
                  {/*<AnimatedInnerSectionItemDiff value={rewardValueDiff} />*/}
                </InnerSectionWrapper>
                <SectionHDivider/>
                <InnerSectionWrapper>
                  <ItemTitle>Spending balance</ItemTitle>
                  <InnerSectionItemIcon>
                    <CentrapayIcon />
                  </InnerSectionItemIcon>
                  <InnerSectionItem>{PreDefinedAssetIdName[PreDefinedAssetId.spendingToken]}</InnerSectionItem>
                  <InnerSectionItemNum>{stakingAccount.assets[PreDefinedAssetId.spendingToken].totalBalance.toString}</InnerSectionItemNum>
                  <InnerSectionItem>Reserved: {stakingAccount.assets[PreDefinedAssetId.spendingToken].reservedBalance.toString}</InnerSectionItem>
                  <InnerSectionItem>Total: {stakingAccount.assets[PreDefinedAssetId.spendingToken].totalBalance.toString}</InnerSectionItem>
                  <AnimatedInnerSectionItemDiff value={rewardSpendingValueDiff} />
                </InnerSectionWrapper>
              </SectionLayoutInnerWrapper>
              <SavePreferenceSection {...{validatorPreferences, setChangeStakingPreferenceModalOpen, intentionsIndex}}/>
            </Left>
            <Right>
              <Item>
                <ItemTitle>Warning received</ItemTitle>
                <WarningContent>
                  <ItemNum>{warningValue}</ItemNum> warning
                </WarningContent>
              </Item>
              <Item>
                <ItemTitle>Punishment</ItemTitle>
                <PunishmentContent>
                  <ItemNum>{punishmentValue}</ItemNum> {PreDefinedAssetIdName[PreDefinedAssetId.stakingToken]}
                </PunishmentContent>
              </Item>
              <Item>
                <ItemTitle>Reward</ItemTitle>
                <RewardContent>
                  <ItemNum>{rewardValue}</ItemNum> {PreDefinedAssetIdName[PreDefinedAssetId.stakingToken]}
                </RewardContent>
                <RewardContent>
                  <ItemNum>{rewardSpendingValue}</ItemNum> {PreDefinedAssetIdName[PreDefinedAssetId.spendingToken]}
                </RewardContent>
              </Item>
            </Right>

          </SectionLayoutWrapper>
        </div>
      </MainContent>
      <UnStakeWarningModal {...{isUnStakeWarningModalOpen, setUnStakeWarningModalOpen, onUnStake, stakingWallet, stakingAccount}}/>
      <ChangeStakingPreferenceModal {...{isChangeStakingPreferenceModalOpen, setChangeStakingPreferenceModalOpen, stakingWallet, stakingAccount, onSaveStakingPreferences }} />
    </MainLayout>
  );
};

export default withContainer(StakingStakePage);
