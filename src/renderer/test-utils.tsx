import React, { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

type Options = {
  route?: string;
  queryClient?: QueryClient;
};

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const client =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return {
    client,
    ...render(ui, { wrapper: Wrapper }),
  };
}
