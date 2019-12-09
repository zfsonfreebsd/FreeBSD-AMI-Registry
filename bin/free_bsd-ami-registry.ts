#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { FreeBsdAmiRegistryStack } from '../lib/free_bsd-ami-registry-stack';

const app = new cdk.App();
new FreeBsdAmiRegistryStack(app, 'FreeBsdAmiRegistryStack');
