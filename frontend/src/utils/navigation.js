export const getRedirectPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
}; 