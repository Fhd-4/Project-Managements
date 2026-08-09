export const environment = {
  production: false,
  apiUrl: 'https://localhost:7130',
  endpoints: {
    auth: {
      login: '/api/Auth/login',
      register: '/api/Auth/register',
      verifyLogin2Fa: '/api/Auth/verify-login-2fa',
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