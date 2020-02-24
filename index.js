#!/usr/bin/env node

'use strict';

const child_process = require('child_process'),
	path = require('path'),
	fetch = require('node-fetch'),
	unzipper = require('unzipper'),
	fs = require('fs-extra'),
	argv = require('yargs').argv,
	unparse = require('yargs-unparser'),
	HttpsProxyAgent = require('https-proxy-agent');

	var fetchOptions = {};
	var httpProxy = (process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY
		|| process.env.HTTPS_PROXY || '').trim();
	if (httpProxy) {
		fetchOptions = { agent: new HttpsProxyAgent(httpProxy)}
	}

	var SONAR_VERSION = argv.t || argv.target || null;


	delete argv.t;
	delete argv.target;

	async function getTags(page){
		try{
			var res = await fetch("https://api.github.com/repos/SonarSource/sonar-scanner-cli/tags"
			+"?page="+page, fetchOptions)
			var data = await res.json();
		} catch (err) {
			console.error(err);
			throw new Error("Couldn't get tags from Github API.");
		}
		if (data.length == 0){
			throw new Error("Couldn't find target sonar-scanner-cli version: "
				+ SONAR_VERSION);
		}
		if (!SONAR_VERSION){
			SONAR_VERSION = data[0].name;
		}
		var gotcha = data.some(element => {
			return checkEqualVersion(element.name);
		});

		if(gotcha){
			console.log("Found ", SONAR_VERSION, ". Start download CLI now...");
			if (!isAlreadyInstalled()) {
				const buffer = await getBinary();
				console.log('download complete. extract binary...');
				await unzip(buffer);
				cleanDirectory();
				console.log('install complete.');
			} else {
				console.log("already installed cli. skip download...")
			}
			changePermission();
		} else {
			getTags(++page);
		}
	}


	var isAlreadyInstalled = function(){
		return fs.existsSync(path.join(__dirname, 'lib'
		, 'sonar-scanner-cli-' + SONAR_VERSION + '.jar'));
	}

	async function getBinary(){			
		try{
			var res = await fetch("https://binaries.sonarsource.com/Distribution/"
								+ "sonar-scanner-cli/sonar-scanner-cli-"
								+ SONAR_VERSION + ".zip", fetchOptions);
			return await res.buffer();
		}catch(err){
			console.error(err);
			throw new Error('sonar-scanner-cli download failed.');
		}
	}

	async function unzip(buffer) {
		try {
			var d = await unzipper.Open.buffer(buffer);
			await d.extract({path: path.join(__dirname)});
		} catch(err){
			console.error(err);
			throw new Error("couldn't extract binary.")
		}
	}

	var cleanDirectory = function(){
		const prefix = 'sonar-scanner-';
		const newBinPath = path.join(__dirname, 'bin');
		const newLibPath = path.join(__dirname, 'lib');
		fs.removeSync(newBinPath);
		fs.removeSync(newLibPath);
		try{
			fs.moveSync(
				path.join(__dirname, prefix + SONAR_VERSION, 'bin')
				, newBinPath);
				
			fs.moveSync(
				path.join(__dirname, prefix + SONAR_VERSION, 'lib')
				, newLibPath);
				
		} catch(e){
			console.error(e);
			throw new Error("Couldn't move files. please check logs.");
		}
		fs.removeSync(path.join(__dirname, prefix + SONAR_VERSION));
		return;
	}

	var checkEqualVersion = function(name){
		if (name == SONAR_VERSION){
			return true;
		}
		return false;
	}

	var changePermission = function(){
		if (process.platform === 'win32') {
			runAfterInstall();
			return;
		}
		var script = path.join(__dirname, 'bin', 'sonar-scanner'),
			command = 'chmod',
			args = ['+x', script];

		var child = child_process.spawn(command, args, {
			stdio: 'inherit'
		});

		child.on('close', function(code) {
			runAfterInstall();
		});

	}

	var runAfterInstall = function(){
		
		var args = unparse(argv),
		script = path.join(__dirname, 'bin', 'sonar-scanner'),
		command;
		
		if (process.platform === 'win32') {
			command = 'cmd.exe';
			args = ['/c', (script + '.bat')].concat(args);
		}
		else {
			command = script;
		}
		
		var child = child_process.spawn(command, args, {
			stdio: 'inherit'
		});
		
		child.on('close', function(code) {
			console.log('sonar-scanner install complete.');
			process.exit(code);
		});

		child.on('error', function(err){
			console.error(err);
		});
	}


getTags(1).catch((err) => {
	console.error(err);
	process.exit(1);
});
