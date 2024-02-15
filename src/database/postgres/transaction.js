'use strict';

module.exports = function (module) {
	module.transaction = async function (perform, txClient) {
		let res;
		if (txClient) {
			await txClient.query(`SAVEPOINT QueryTower_subtx`);
			try {
				res = await perform(txClient);
			} catch (err) {
				await txClient.query(`ROLLBACK TO SAVEPOINT QueryTower_subtx`);
				throw err;
			}
			await txClient.query(`RELEASE SAVEPOINT QueryTower_subtx`);
			return res;
		}
		// see https://node-postgres.com/features/transactions#a-pooled-client-with-async-await
		const client = await module.pool.connect();

		try {
			await client.query('BEGIN');
			res = await perform(client);
			await client.query('COMMIT');
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}
		return res;
	};
};
