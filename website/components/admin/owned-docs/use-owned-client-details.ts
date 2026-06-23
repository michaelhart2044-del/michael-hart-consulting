'use client';

import { useState } from 'react';
import type { PrepSubmission } from '@/lib/submissions-store';

export interface OwnedClientDetailsState {
  company: string;
  setCompany: (value: string) => void;
  streetAddress: string;
  setStreetAddress: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
  payload: () => {
    company: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export function useOwnedClientDetails(submission: PrepSubmission): OwnedClientDetailsState {
  const [company, setCompany] = useState(
    () => submission.clientCompany || submission.industry || '',
  );
  const [streetAddress, setStreetAddress] = useState(
    () => submission.clientStreetAddress || '',
  );
  const [city, setCity] = useState(() => submission.clientCity || '');
  const [state, setState] = useState(() => submission.clientState || '');
  const [postalCode, setPostalCode] = useState(() => submission.clientPostalCode || '');

  return {
    company,
    setCompany,
    streetAddress,
    setStreetAddress,
    city,
    setCity,
    state,
    setState,
    postalCode,
    setPostalCode,
    payload: () => ({ company, streetAddress, city, state, postalCode }),
  };
}
