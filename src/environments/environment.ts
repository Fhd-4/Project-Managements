export const environment = {
  production: true,
  apiUrl: 'https://prosync-swagger.runasp.net/api',
  endpoints: {
    auth: {
      login: '/api/Auth/login',
      register: '/api/Auth/register',
      verifyLogin2Fa: '/api/Auth/verify-login-2fa',
      toggle2Fa: '/api/Auth/toggle-2fa',
      allUsers: '/api/Auth/all-users',
      changePassword: '/api/Auth/change-password',
      forgotPassword: '/api/Auth/forgot-password',
      resetPassword: '/api/Auth/reset-password',
      createRole: '/api/Auth/create-role',
      roles: '/api/Auth/roles',
      createSuperAdmin: '/api/Auth/create-superadmin',
      deleteUser: '/api/Auth/delete-user'
    
    }
  }
};