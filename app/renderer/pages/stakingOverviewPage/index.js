import React, { useEffect, useState } from 'react';
import { MainContent, MainLayout } from 'components/layout';
import { PageHeading, Button } from 'components';
import styled from 'styled-components';

import theme from 'theme';
import { PreDefinedAssetId } from 'common/types/theNode.types';
import StakingProgressCard from './StakingProgressCard';
import withContainer from './container';
import ValidatorsList from './ValidatorsList';
import WaitingList from './WaitingList';
import useApis from './useApis';
import useApi from './useApi';

const PageTitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TextTitleWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const NextUpHintText = styled.div`
  font-size: 10px;
  background: ${theme.listitemHighlightGradient};
  border-radius: 12px;
  height: 1.2rem;
  line-height: 1.2rem;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
`;

const ListsWrapper = styled.div`
  margin: 2rem 0;
  display: flex;
  justify-content: space-between;
`;

const reoderList = (arryList, fromIndex, toIndex = 0) => {
  if (Array.isArray(arryList)) {
    arryList.splice(toIndex, 0, arryList.splice(fromIndex, 1)[0]);
    return arryList;
  }
  return [];
};

const sortedListWithBalances = (accountList, premierAccount, setValueFn) => {
  if (accountList) {
    const index = accountList.indexOf(premierAccount);
    const reoderAccountList = index === -1 ? accountList : reoderList(accountList, index);
    Promise.all(
      reoderAccountList.map(async account => {
        const stakingTokenBalance = await window.appApi.getGenericAssetFreeBalance(
          PreDefinedAssetId.stakingToken,
          account
        );
        return (
          stakingTokenBalance && {
            address: account,
            stakingTokenBalance: stakingTokenBalance.toString(10),
          }
        );
      })
    ).then(result => setValueFn(result));
  }
};

const StakingOverviewPage = ({
  subNav,
  onClickStakeButton,
  stakingStashAccountAddress,
  wsLocalStatus,
}) => {
  const [eraProgress, eraLength, sessionProgress, sessionLength, validators, intentions] = useApis(
    'getEraProgress',
    'getEraLength',
    'getSessionProgress',
    'getSessionLength',
    'getValidators',
    'getIntentions'
  );

  /**
   * Can not use withApis in func
   * Otherwise: Rendered more hooks than during the previous render.
   *
   */

  const [intentionsWithBalances, setIntentionsWithBalances] = useState([]);
  const [validatorsWithBalances, setValidatorsWithBalances] = useState([]);

  useEffect(() => {
    const sortedIntentions =
      intentions && validators
        ? intentions.filter(accountId => !validators.find(validatorId => validatorId === accountId))
        : [];

    sortedListWithBalances(sortedIntentions, stakingStashAccountAddress, setIntentionsWithBalances);
    sortedListWithBalances(validators, stakingStashAccountAddress, setValidatorsWithBalances);
  }, [validators, intentions]);

  const toShowNextUpHintText =
    intentionsWithBalances.filter(waitingUser => waitingUser.address === stakingStashAccountAddress)
      .length > 0;

  return (
    <MainLayout subNav={subNav}>
      <MainContent>
        <PageHeading subHeading="Here you can view when the next era is, and how your stake is performing amongst other validators.">
          <PageTitleWrapper>
            <TextTitleWrapper>
              <div>Staking overview</div>
              {toShowNextUpHintText && (
                <NextUpHintText>You may join validator list at next era</NextUpHintText>
              )}
            </TextTitleWrapper>
            <Button
              style={{ display: stakingStashAccountAddress ? 'none' : 'block' }}
              size="lg"
              onClick={() => onClickStakeButton()}
            >
              Stake
            </Button>
          </PageTitleWrapper>
        </PageHeading>
        <StakingProgressCard
          eraProgress={eraProgress}
          eraLength={eraLength}
          sessionLength={sessionLength}
          sessionProgress={sessionProgress}
        />
        <ListsWrapper>
          <ValidatorsList
            validators={validatorsWithBalances}
            stakingStashAccountAddress={stakingStashAccountAddress}
          />
          <WaitingList
            waitingList={intentionsWithBalances}
            stakingStashAccountAddress={stakingStashAccountAddress}
          />
        </ListsWrapper>
      </MainContent>
    </MainLayout>
  );
};

export default withContainer(StakingOverviewPage);
