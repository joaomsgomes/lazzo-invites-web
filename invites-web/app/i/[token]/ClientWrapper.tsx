'use client';

import { ReactNode } from 'react';
import AppRedirect from './AppRedirect';

interface ClientWrapperProps {
  token: string;
  children: ReactNode;
}

export default function ClientWrapper({ token, children }: ClientWrapperProps) {
  return (
    <>
      <AppRedirect token={token} />
      {children}
    </>
  );
}
