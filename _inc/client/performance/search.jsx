/**
 * External dependencies
 */
import React, { Fragment, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import ProgressBar from 'components/progress-bar';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FormFieldset } from 'components/forms';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FEATURE_SEARCH_JETPACK, getPlanClass } from 'lib/plans/constants';
import { SEARCH_DESCRIPTION, SEARCH_CUSTOMIZE_CTA, SEARCH_SUPPORT } from 'plans/constants';
import { isAtomicSite } from 'state/initial-state';
import { hasUpdatedSetting, isSettingActivated, isUpdatingSetting } from 'state/settings';
import {
	getSitePlan,
	hasActiveSearchPurchase as selectHasActiveSearchPurchase,
	isFetchingSitePurchases,
} from 'state/site';
import { fetchSyncProgress, getSyncProgress } from 'state/sync-progress';

import './search.scss';

function toggleModuleFactory( {
	getOptionValue,
	hasActiveSearchPurchase,
	toggleModuleNow,
	updateOptions,
} ) {
	return module => {
		toggleModuleNow( module );
		if ( hasActiveSearchPurchase && getOptionValue( 'search' ) ) {
			updateOptions( { instant_search_enabled: true } );
		}
	};
}

function toggleInstantSearchFactory( { hasActiveSearchPurchase, getOptionValue, updateOptions } ) {
	return () => {
		if ( hasActiveSearchPurchase && getOptionValue( 'search' ) ) {
			updateOptions( {
				instant_search_enabled: ! getOptionValue( 'instant_search_enabled', 'search' ),
			} );
		}
	};
}

function Search( props ) {
	const isModuleEnabled = props.getOptionValue( 'search' );
	const isInstantSearchEnabled = props.getOptionValue( 'instant_search_enabled', 'search' );

	const toggleModule = useMemo( () => toggleModuleFactory( props ), [
		props.hasActiveSearchPurchase,
	] );
	const toggleInstantSearch = useMemo( () => toggleInstantSearchFactory( props ), [
		props.hasActiveSearchPurchase,
	] );

	useEffect( () => {
		props.fetchSyncProgress();
	}, [] );

	useEffect( () => {
		if ( props.failedToEnableSearch && props.hasActiveSearchPurchase ) {
			props.updateOptions( { has_jetpack_search_product: true } );
			toggleModule( 'search' );
		}
	}, [ props.failedToEnableSearch, props.hasActiveSearchPurchase, toggleModule ] );

	return (
		<SettingsCard { ...props } module="search" feature={ FEATURE_SEARCH_JETPACK } hideButton>
			<SettingsGroup
				hasChild
				module={ { module: 'search' } }
				support={ {
					text: SEARCH_SUPPORT,
					link: getRedirectUrl( 'jetpack-support-search' ),
				} }
			>
				{ ! props.isAtomicSite && ( props.isBusinessPlan || props.hasActiveSearchPurchase ) && (
					<div className="jp-form-search-setting-progress">
						<ProgressBar
							isPulsing={ props.syncProgress !== 100 }
							value={ Number.isFinite( props.syncProgress ) ? props.syncProgress : 100 }
						/>
						<div className="jp-form-search-setting-progress-text">
							{ ! Number.isFinite( props.syncProgress ) &&
								__( "Loading your site's indexing status…" ) }
							{ Number.isFinite( props.syncProgress ) &&
								props.syncProgress !== 100 &&
								__( 'Your site is currently being indexed for search…' ) }
							{ props.syncProgress === 100 && __( 'Your site search is fully operational.' ) }
						</div>
					</div>
				) }
				<p>{ SEARCH_DESCRIPTION } </p>
				{ props.isLoading && __( 'Loading…' ) }
				{ ! props.isLoading && ( props.isBusinessPlan || props.hasActiveSearchPurchase ) && (
					<Fragment>
						<ModuleToggle
							activated={ isModuleEnabled }
							compact
							slug="search"
							toggleModule={ toggleModule }
							toggling={ props.isSavingAnyOption( 'search' ) }
						>
							{ __( 'Enable Search' ) }
						</ModuleToggle>

						{ ! props.isAtomicSite && (
							// NOTE: Jetpack Search currently does not support atomic sites.
							<FormFieldset>
								<CompactFormToggle
									checked={ isInstantSearchEnabled }
									disabled={ ! props.hasActiveSearchPurchase || ! isModuleEnabled }
									onChange={ toggleInstantSearch }
									toggling={ props.isSavingAnyOption( 'instant_search_enabled' ) }
								>
									<span className="jp-form-toggle-explanation">
										{ __( 'Enable instant search experience (recommended)' ) }
									</span>
								</CompactFormToggle>
								<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
									{ __(
										'Instant search will allow your visitors to get search results as soon as they start typing. ' +
											'If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.'
									) }
								</p>
							</FormFieldset>
						) }
					</Fragment>
				) }
			</SettingsGroup>
			{ ! props.isLoading &&
				( props.isBusinessPlan || props.hasActiveSearchPurchase ) &&
				isModuleEnabled &&
				! isInstantSearchEnabled && (
					<Card
						compact
						className="jp-settings-card__configure-link"
						href="customize.php?autofocus[panel]=widgets"
					>
						{ __( 'Add Jetpack Search Widget' ) }
					</Card>
				) }
			{ props.hasActiveSearchPurchase && isModuleEnabled && isInstantSearchEnabled && (
				<Card
					className="jp-settings-card__configure-link"
					compact
					href="customize.php?autofocus[section]=jetpack_search"
				>
					{ SEARCH_CUSTOMIZE_CTA }
				</Card>
			) }
		</SettingsCard>
	);
}

export default connect(
	state => {
		const planClass = getPlanClass( getSitePlan( state ).product_slug );
		return {
			failedToEnableSearch:
				! isSettingActivated( state, 'search' ) &&
				! isUpdatingSetting( state, 'search' ) &&
				false === hasUpdatedSetting( state, 'search' ),
			hasActiveSearchPurchase: selectHasActiveSearchPurchase( state ),
			isAtomicSite: isAtomicSite( state ),
			isBusinessPlan: 'is-business-plan' === planClass,
			isLoading: isFetchingSitePurchases( state ),
			syncProgress: getSyncProgress( state ),
		};
	},
	{ fetchSyncProgress }
)( withModuleSettingsFormHelpers( Search ) );
