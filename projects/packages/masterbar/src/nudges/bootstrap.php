<?php
/**
 * Bootstrap file for the nudges.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * The WP_Customize_Control core class is loaded only on customize_register.
 *
 * @param \WP_Customize_Manager $customize_manager Core customize manager.
 */
function register_css_nudge_control( \WP_Customize_Manager $customize_manager ) {
	$domain = ( new Status() )->get_site_suffix();

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$manager = new WPCOM_Additional_CSS_Manager( $domain );
	} elseif ( ( new Host() )->is_woa_site() ) {
		$manager = new Atomic_Additional_CSS_Manager( $domain );
	}

	if ( ! isset( $manager ) ) {
		return;
	}

	$manager->register_nudge( $customize_manager );
}

/**
 * Load the bootstrap on init action.
 *
 * We need to load on init because otherwise the filter will not be set to true in WPCOM (since the add_filter is set on init).
 */
function load_bootstrap_on_init() {

	/**
	 * Disable Additional CSS section from Customizer in WPCOM and Atomic and replace it with a nudge.
	 *
	 * @module masterbar
	 *
	 * @since jetpack-9.9.0
	 *
	 * @param bool
	 */
	if ( \apply_filters( 'jetpack_customize_enable_additional_css_nudge', false ) ) {
		\add_action( 'customize_register', __NAMESPACE__ . '\register_css_nudge_control' );
	}
}

add_action( 'init', __NAMESPACE__ . '\load_bootstrap_on_init' );
