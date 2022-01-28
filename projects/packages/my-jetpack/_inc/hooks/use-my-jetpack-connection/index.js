/* global myJetpackInitialState */

/* global myJetpackRest */
/**
 * WordPress dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { useEffect } from 'react';

/**
 * React custom hook to get the site purchases data.
 *
 * @param   {object} options           - Options to pass to the hook.
 * @param   {boolean} options.reditect - Perform a redirect when no connection is found.
 * @returns {object} site purchases data
 */
export default function useMyJetpackConnection( options = { redirect: false } ) {
	const { apiRoot, apiNonce } = myJetpackRest;
	const { redirect } = options;
	const connectionData = useConnection( { apiRoot, apiNonce } );

	// Alias: https://github.com/Automattic/jetpack/blob/master/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;

	/*
	 * When the site is not connect,
	 * and the `redirect` option is set to `true`,
	 * redirect to the Jetpack dashboard.
	 */
	useEffect( () => {
		// Bail early when redirect mode is disabled.
		if ( ! redirect ) {
			return;
		}

		// When site is connected, bail early.
		if ( isSiteConnected ) {
			return;
		}

		window.location = myJetpackInitialState.topJetpackMenuItemUrl;
	}, [ isSiteConnected, redirect ] );

	return {
		...connectionData,
		isSiteConnected,
	};
}
