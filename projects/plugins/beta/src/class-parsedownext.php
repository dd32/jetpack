<?php
/**
 * Extension for Parsedown.
 *
 * @package automattic/jetpack-beta
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName

namespace Automattic\JetpackBeta;

use Parsedown;

/**
 * Extension for Parsedown.
 *
 * Adds linking of GitHub PRs.
 */
class ParsedownExt extends Parsedown {

	/**
	 * Format for generating PR links.
	 *
	 * @var string|null
	 */
	protected $prLinkFormat = null;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->InlineTypes['#'][] = 'PRLink';
		$this->inlineMarkerList  .= '#';
	}

	/**
	 * Set the PR link format (and enable PR links).
	 *
	 * @param string $format Printf-style format string. Should include `%d` for the PR number.
	 * @return $this
	 */
	public function setPRLinkFormat( $format ) {
		$this->prLinkFormat = $format;
		return $this;
	}

	/**
	 * Link PRs.
	 *
	 * @param array $excerpt Excerpt.
	 * @return array|null
	 */
	protected function inlinePRLink( $excerpt ) {
		if ( null === $this->prLinkFormat ||
			! preg_match( '/^#(\d+)/', $excerpt['text'], $m )
		) {
			return null;
		}

		return array(
			'extent'  => strlen( $m[0] ),
			'element' => array(
				'name'       => 'a',
				'text'       => $m[0],
				'attributes' => array(
					'href' => sprintf( $this->prLinkFormat, (int) $m[1] ),
				),
			),
		);
	}

	/**
	 * Remove HTML comments.
	 *
	 * Parsedown disables its code that does this in safe mode. Restore it here.
	 *
	 * @param array $excerpt Excerpt.
	 * @return array|null
	 */
	protected function inlineMarkup( $excerpt ) {
		// Code adapted from vendor/erusev/parsedown/Parsedown.php
		if ( $excerpt['text'][1] === '!' && preg_match( '/^<!---?[^>-](?:-?[^-])*-->/s', $excerpt['text'], $m ) ) {
			return array(
				'markup' => '', // Just strip it, don't preserve it like Parsedown non-safe-mode does.
				'extent' => strlen( $m[0] ),
			);
		}

		return null;
	}
}
