nodejs-sonar-scanner
==================

Wrap [SonarQube Scanner](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner) as a node module.

# Installation

You can install nodejs-sonar-scanner as a development dependency and add it as a script property in your package.json.

```shell
npm i nodejs-sonar-scanner --save-dev
```     

# Use latest Version

```json
{
  "scripts": {
    "sonar-scanner": "node_modules/nodejs-sonar-scanner/bin/sonar-scanner"
  }
}
```

```shell
npm run sonar-scanner
```     

# Use specific Version

```json
{
  "scripts": {
    "sonar-scanner": "node_modules/nodejs-sonar-scanner/bin/sonar-scanner -t 4.2.0.1873"
  }
}
```


```shell
npm run sonar-scanner
```     


# Forked from
https://github.com/bcaudan/node-sonar-scanner
