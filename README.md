# Windows

[![node](https://img.shields.io/badge/node-20-iron)](https://nodejs.org/download/release/latest-iron/) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/internxt/drive-desktop) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=coverage)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=internxt_drive-desktop&metric=bugs)](https://sonarcloud.io/summary/new_code?id=internxt_drive-desktop)

# Addon

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/internxt/node-win) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=coverage)](https://sonarcloud.io/summary/new_code?id=internxt_node-win) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=internxt_node-win&metric=bugs)](https://sonarcloud.io/summary/new_code?id=internxt_node-win)


# Setup

This guide explains how to set up and build the `drive-desktop` project.

## Prerequisites

Before proceeding, ensure you have the following tools installed:

- **NVM**

https://github.com/coreybutler/nvm-windows


- **Node.js 20**

```bash
nvm install 20
```

- **node-gyp**

```bash
npm install -g node-gyp
```

- **Python 3.10**

Install using win store

- **Visual Studio** (not VS Code) for building native dependencies.

![alt text](public/image-1.png)
![alt text](public/image.png)

## Build Steps

```bash
npm run init:dev
npm run clamav # optional
npm run start
```
