import { getDotComCredentials } from '../../helpers/utils-helper.js';
import logger from '../../logger.js';
import PageActions from '../page-actions.js';
import WpPage from '../wp-page.js';

export default class LoginPage extends WpPage {
	constructor( page ) {
		const url = 'https://jetpack.com/redirect/?source=wpcom-log-in';
		super( page, {
			expectedSelectors: [ '.wp-login__container' ],
			url,
		} );
	}

	static async isDisplayed( page ) {
		const pa = new PageActions( page );
		await pa.waitForDomContentLoaded();
		return await pa.isElementVisible( '#wpcom .wp-login__container', 2000 );
	}

	async login( credentials = getDotComCredentials(), { retry = true } = {} ) {
		logger.step( 'Log in to WordPress.com' );

		const usernameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';
		const continueButtonSelector = '//button[text()="Continue"]';
		const submitButtonSelector = '//button[text()="Log In"]';

		try {
			await this.fill( usernameSelector, credentials.username );
			await this.click( continueButtonSelector );
			await this.waitForElementToBeVisible( passwordSelector );
			await this.fill( passwordSelector, credentials.password );
			await this.click( submitButtonSelector );
			await this.waitForElementToBeHidden( submitButtonSelector );
		} catch ( e ) {
			if ( retry === true ) {
				logger.warn( `The login didn't work as expected - retrying now: '${ e }'` );
				await this.reload();
				return await this.login( credentials, { retry: false } );
			}
			throw e;
		}

		// save storage state to reuse later to skip log in
		await this.saveCurrentStorageState();
	}

	async continueWithout() {
		const continueSelector =
			'.jetpack-connect-site-only__form a.jetpack-connect-site-only__continue-link';
		await this.click( continueSelector );
		return await this.waitForElementToBeHidden( this.selectors[ 0 ] );
	}

	async isLoggedIn() {
		const continueAsUserSelector = '#content .continue-as-user';
		return this.isElementVisible( continueAsUserSelector, 2000 );
	}
}
