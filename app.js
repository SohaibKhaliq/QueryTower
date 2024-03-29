'use strict';

require('./require-main');

const nconf = require('nconf');

nconf.argv().env({
	separator: '__',
});

const winston = require('winston');
const path = require('path');

const file = require('./src/file');

process.env.NODE_ENV = process.env.NODE_ENV || 'developement';
global.env = process.env.NODE_ENV || 'developement';

// Alternate configuration file support
const configFile = path.resolve(__dirname, nconf.any(['config', 'CONFIG']) || 'config.json');

const configExists = file.existsSync(configFile) || (nconf.get('url') && nconf.get('secret') && nconf.get('database'));

const prestart = require('./src/prestart');

prestart.loadConfig(configFile);
prestart.setupWinston();
prestart.versionCheck();
winston.verbose('* using configuration stored in: %s', configFile);

if (!process.send) {
	// If run using `node app`, log GNU copyright info along with server info
	winston.info(`QueryTower v${nconf.get('version')} Copyright (C) ${(new Date()).getFullYear()} Digitics Inc.`);
	winston.info('');
}

if (nconf.get('setup') || nconf.get('install')) {
	require('./src/cli/setup').setup();
} else if (!configExists) {
	require('./install/web').install(nconf.get('port'));
} else if (nconf.get('upgrade')) {
	require('./src/cli/upgrade').upgrade(true);
} else if (nconf.get('reset')) {
	require('./src/cli/reset').reset({
		theme: nconf.get('t'),
		plugin: nconf.get('p'),
		widgets: nconf.get('w'),
		settings: nconf.get('s'),
		all: nconf.get('a'),
	});
} else if (nconf.get('activate')) {
	require('./src/cli/manage').activate(nconf.get('activate'));
} else if (nconf.get('plugins') && typeof nconf.get('plugins') !== 'object') {
	require('./src/cli/manage').listPlugins();
} else if (nconf.get('build')) {
	require('./src/cli/manage').build(nconf.get('build'));
} else if (nconf.get('events')) {
	require('./src/cli/manage').listEvents();
} else {
	require('./src/start').start();
}
