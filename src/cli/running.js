'use strict';

const fs = require('fs');
const childProcess = require('child_process');
const chalk = require('chalk');

const fork = require('../meta/debugFork');
const { paths } = require('../constants');

const cwd = paths.baseDir;

function getRunningPid(callback) {
	fs.readFile(paths.pidfile, {
		encoding: 'utf-8',
	}, (err, pid) => {
		if (err) {
			return callback(err);
		}

		pid = parseInt(pid, 10);

		try {
			process.kill(pid, 0);
			callback(null, pid);
		} catch (e) {
			callback(e);
		}
	});
}

function start(options) {
	if (options.dev) {
		process.env.NODE_ENV = 'development';
		fork(paths.loader, ['--no-daemon', '--no-silent'], {
			env: process.env,
			stdio: 'inherit',
			cwd,
		});
		return;
	}
	if (options.log) {
		console.log(`\n${[
			chalk.bold('Starting QueryTower with logging output'),
			chalk.red('Hit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit'),
			'The QueryTower process will continue to run in the background',
			`Use "${chalk.yellow('./QueryTower stop')}" to stop the QueryTower server`,
		].join('\n')}`);
	} else if (!options.silent) {
		console.log(`\n${[
			chalk.bold('Starting QueryTower'),
			`  "${chalk.yellow('./QueryTower stop')}" to stop the QueryTower server`,
			`  "${chalk.yellow('./QueryTower log')}" to view server output`,
			`  "${chalk.yellow('./QueryTower help')}" for more commands\n`,
		].join('\n')}`);
	}

	const child = fork(paths.loader, process.argv.slice(3), {
		env: process.env,
		cwd,
	});
	if (options.log) {
		childProcess.spawn('tail', ['-F', './logs/output.log'], {
			stdio: 'inherit',
			cwd,
		});
	}

	return child;
}

function stop() {
	getRunningPid((err, pid) => {
		if (!err) {
			process.kill(pid, 'SIGTERM');
			console.log('Stopping QueryTower. Goodbye!');
		} else {
			console.log('QueryTower is already stopped.');
		}
	});
}

function restart(options) {
	getRunningPid((err, pid) => {
		if (!err) {
			console.log(chalk.bold('\nRestarting QueryTower'));
			process.kill(pid, 'SIGTERM');

			options.silent = true;
			start(options);
		} else {
			console.warn('QueryTower could not be restarted, as a running instance could not be found.');
		}
	});
}

function status() {
	getRunningPid((err, pid) => {
		if (!err) {
			console.log(`\n${[
				chalk.bold('QueryTower Running ') + chalk.cyan(`(pid ${pid.toString()})`),
				`\t"${chalk.yellow('./QueryTower stop')}" to stop the QueryTower server`,
				`\t"${chalk.yellow('./QueryTower log')}" to view server output`,
				`\t"${chalk.yellow('./QueryTower restart')}" to restart QueryTower\n`,
			].join('\n')}`);
		} else {
			console.log(chalk.bold('\QueryTower is not running'));
			console.log(`\t"${chalk.yellow('./QueryTower start')}" to launch the QueryTower server\n`);
		}
	});
}

function log() {
	console.log(`${chalk.red('\nHit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit\n')}\n`);
	childProcess.spawn('tail', ['-F', './logs/output.log'], {
		stdio: 'inherit',
		cwd,
	});
}

exports.start = start;
exports.stop = stop;
exports.restart = restart;
exports.status = status;
exports.log = log;
