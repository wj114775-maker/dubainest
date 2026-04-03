import { QueryClient } from '@tanstack/react-query';
import { isRetryBlockedBase44Error } from "@/lib/base44Safeguards";


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			staleTime: 60 * 1000,
			retry: (failureCount, error) => {
				if (isRetryBlockedBase44Error(error)) return false;
				return failureCount < 1;
			},
		},
	},
});
