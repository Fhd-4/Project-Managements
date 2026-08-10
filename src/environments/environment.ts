export const environment = {
  production: true,
  apiUrl: 'https://prosync-swagger.runasp.net/api',
  endpoints: {
    auth: {
      login: '/Auth/login',
      register: '/Auth/register',
      verifyLogin2Fa: '/Auth/verify-login-2fa',
      toggle2Fa: '/Auth/toggle-2fa',
      allUsers: '/Auth/all-users',
      changePassword: '/Auth/change-password',
      forgotPassword: '/Auth/forgot-password',
      resetPassword: '/Auth/reset-password',
      createRole: '/Auth/create-role',
      roles: '/Auth/roles',
      createSuperAdmin: '/Auth/create-superadmin',
      deleteUser: '/Auth/delete-user'
  
    }
  }
};