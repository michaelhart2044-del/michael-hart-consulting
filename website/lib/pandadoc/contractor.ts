import { site } from '@/lib/site';

/** Contractor / sender details for PandaDoc agreements and invoices. */
export const contractorProfile = {
  firstName: 'Michael',
  lastName: 'Hart',
  company: site.legalName,
  streetAddress: '246 Round Pond Drive',
  city: 'Lilburn',
  state: 'GA',
  postalCode: '30047',
  phone: site.phone,
  email: site.email,
} as const;
