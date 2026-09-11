/** Business values are deliberately unset until TORO supplies real terms. */
export const prototypeBusiness = {
  mode: 'prototype',
  pricing: null,
  inquiryRecipient: null,
  delivery: 'download-only',
} as const;

/** Reserved example address; never used as a recipient or sent over the network. */
export const exampleContact = { name: 'Jan Ukázka', email: 'ukazka@example.com', city: 'Ukázkové město' };
