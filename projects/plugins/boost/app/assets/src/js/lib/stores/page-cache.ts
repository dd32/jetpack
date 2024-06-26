import { standardizeError } from '$lib/utils/standardize-error';
import {
	DataSyncError,
	useDataSync,
	useDataSyncAction,
} from '@automattic/jetpack-react-data-sync-client';
import { useState } from 'react';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';

export const PageCacheError = z
	.object( {
		code: z.string(),
		message: z.string(),
		dismissed: z.boolean().optional(),
	} )
	.nullable();

export type PageCacheError = z.infer< typeof PageCacheError >;

export const PageCacheSetupSuccess = z.object( {
	success: z.literal( true ),
	notices: z.array(
		z.object( {
			message: z.string(),
			title: z.string(),
		} )
	),
} );

export type PageCacheSetupSuccess = z.infer< typeof PageCacheSetupSuccess >;

export const PageCache = z.object( {
	bypass_patterns: z.array( z.string() ),
	logging: z.boolean(),
} );
const PageCacheClear = z.object( {
	message: z.string(),
} );

export function usePageCacheError() {
	return useDataSync( 'jetpack_boost_ds', 'page_cache_error', PageCacheError );
}

export function usePageCache() {
	return useDataSync( 'jetpack_boost_ds', 'page_cache', PageCache );
}

/**
 * Hook which creates a callable action for running Page Cache setup.
 */
export function usePageCacheSetup() {
	const [ , pageCacheErrorMutation ] = usePageCacheError();
	const setError = pageCacheErrorMutation.mutate;
	const [ notices, setNotices ] = useState< PageCacheSetupSuccess[ 'notices' ] >( [] );

	const pageCacheSetup = useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache',
		action_name: 'run-setup',
		schema: {
			state: PageCache,
			action_request: z.void(),
			action_response: PageCacheError.or( PageCacheSetupSuccess ),
		},
		callbacks: {
			onResult( response ) {
				const parse = PageCacheSetupSuccess.safeParse( response );
				if ( parse.success ) {
					setNotices( parse.data.notices );
				} else {
					setNotices( [] );
				}
			},
		},
		mutationOptions: {
			onError: error => {
				if ( error instanceof DataSyncError ) {
					return setError( error.info() );
				}
				const standardizedError = standardizeError( error );
				setError( {
					code: 'unknown_error',
					message: standardizedError.message || __( 'Unknown error occurred.', 'jetpack-boost' ),
				} );
			},
			onSuccess: () => {
				setError( null );
			},
		},
	} );
	return [ pageCacheSetup, notices ] as const;
}

/**
 * Hook which creates a callable action for clearing Page Cache.
 */
export function useClearPageCacheAction() {
	const [ message, setMessage ] = useState( '' );
	const action = useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache',
		action_name: 'clear-page-cache',
		schema: {
			state: PageCache,
			action_request: z.void(),
			action_response: PageCacheClear,
		},
		callbacks: {
			onResult: result => {
				if ( result.message ) {
					setMessage( result.message );
				}
			},
		},
	} );

	return [ message, action ] as const;
}

/**
 * Hook to run an action that disables super cache.
 */
export function useAsyncSuperCacheAction() {
	const action = useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'page_cache',
		action_name: 'deactivate-wpsc',
		schema: {
			state: PageCache,
			action_request: z.void(),
			action_response: PageCacheError.or( z.boolean() ),
		},
	} );

	return action;
}
