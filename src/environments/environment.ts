export const environment = {
  production: false,
  apiUrl: 'http://prosync-swagger.runasp.net/',
  endpoints: {
    auth: {
      login: '/Auth/login',
      register: '/Auth/register',
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
