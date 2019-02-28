// @flow
import os from 'os';
import { uniq, upperFirst } from 'lodash';
import parseArgs from 'minimist';
import mergeOptions from 'merge-options';

import { version } from '../../package.json';
import type { Environment } from './types/environment.types';
import {
  DEVELOPMENT,
  LINUX,
  MAC_OS,
  MAINNET,
  OS_NAMES,
  PRODUCTION,
  STAGING,
  STAGING_REPORT_URL,
  TEST,
  TESTNET,
  WINDOWS,
} from './types/environment.types';

const config = mergeOptions(
  {
    NODE_ENV: process.env.NODE_ENV,
    DEBUG_PROD: process.env.DEBUG_PROD,
  },
  parseArgs(process.argv.slice(1))
);

// environment variables
const CURRENT_NODE_ENV = process.env.NODE_ENV || DEVELOPMENT;
const NETWORK = process.env.NETWORK || DEVELOPMENT;
const REPORT_URL = process.env.REPORT_URL || STAGING_REPORT_URL;
const port = process.env.PORT || 1212;
const isHot = process.env.HOT === '1';
const isDev = CURRENT_NODE_ENV === DEVELOPMENT;
const isDebugProd = config.DEBUG_PROD === 'true'; // currently only apply to main, to support renderer, need to include extra settings in preload.js, can follow this example, https://bitbucket.org/centralitydev/cennz-node-ui/commits/98df9ec2f402a339ac8c6ff8c348cbf4943b422b
const isDevOrDebugProd = isDev || isDebugProd;
const isRemoteDebug = process.env.DEBUG_REMOTE === 'true';
const isTest = CURRENT_NODE_ENV === TEST;
const isProduction = CURRENT_NODE_ENV === PRODUCTION;
const isMainnet = CURRENT_NODE_ENV === MAINNET;
const isStaging = CURRENT_NODE_ENV === STAGING;
const isTestnet = CURRENT_NODE_ENV === TESTNET;
const isWatchMode = process.env.IS_WATCH_MODE;
const API_VERSION = process.env.API_VERSION || 'dev';
const PLATFORM = os.platform();
const OS = OS_NAMES[PLATFORM] || PLATFORM;
const BUILD = process.env.BUILD_NUMBER || 'dev';
const BUILD_NUMBER = uniq([API_VERSION, BUILD]).join('.');
const BUILD_LABEL = (() => {
  const networkLabel = !(isMainnet || isDev) ? ` ${upperFirst(NETWORK)}` : '';
  let buildLabel = `Odin${networkLabel} (${version}#${BUILD_NUMBER})`;
  if (!isProduction) buildLabel += ` ${CURRENT_NODE_ENV}`;
  return buildLabel;
})();
const INSTALLER_VERSION = uniq([API_VERSION, BUILD]).join('.');
const MOBX_DEV_TOOLS = process.env.MOBX_DEV_TOOLS || false;
const isMacOS = PLATFORM === MAC_OS;
const isWindows = PLATFORM === WINDOWS;
const isLinux = PLATFORM === LINUX;

// compose environment
export const environment: Environment = Object.assign(
  {},
  {
    network: NETWORK,
    apiVersion: API_VERSION,
    mobxDevTools: MOBX_DEV_TOOLS,
    current: CURRENT_NODE_ENV,
    reportUrl: REPORT_URL,
    port,
    isHot,
    isDev,
    isDebugProd,
    isDevOrDebugProd,
    isRemoteDebug,
    isTest,
    isProduction,
    isMainnet,
    isStaging,
    isTestnet,
    isWatchMode,
    build: BUILD,
    buildNumber: BUILD_NUMBER,
    buildLabel: BUILD_LABEL,
    platform: PLATFORM,
    os: OS,
    installerVersion: INSTALLER_VERSION,
    version,
    isWindows,
    isMacOS,
    isLinux,
  },
  process.env
);
