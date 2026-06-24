/** Opens the default mail client with a pre-filled draft (Outlook on Windows). */
export function openMailtoDraft(params: {
  to: string;
  subject: string;
  body: string;
}): boolean {
  const { to, subject, body } = params;
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // mailto URLs are limited (~2k chars in some clients); payment bodies stay well under that.
  if (mailto.length > 1800) {
    return false;
  }

  try {
    const link = document.createElement('a');
    link.href = mailto;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}
