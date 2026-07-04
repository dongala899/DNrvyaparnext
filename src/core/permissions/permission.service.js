const DEFAULT_PERMISSIONS = {
  role_admin: { '*': ['*'] },
  role_manager: {
    invoices: ['create', 'read', 'update'],
    quotations: ['create', 'read', 'update'],
    customers: ['create', 'read', 'update'],
    vendors: ['create', 'read', 'update'],
    items: ['create', 'read', 'update'],
    purchases: ['create', 'read', 'update'],
    reports: ['read'],
  },
  role_operator: {
    invoices: ['create', 'read'],
    quotations: ['create', 'read'],
    customers: ['read'],
    vendors: ['read'],
    items: ['read'],
    reports: ['read'],
  },
};

export function createPermissionService(sharedState) {
  return {
    can(user, resource, action) {
      if (!user || !user.roleId) return false;

      const rolePerms = DEFAULT_PERMISSIONS[user.roleId];
      if (!rolePerms) return false;

      if (rolePerms['*'] && rolePerms['*'].includes('*')) return true;

      const resourcePerms = rolePerms[resource];
      if (!resourcePerms) return false;

      return resourcePerms.includes('*') || resourcePerms.includes(action);
    },

    getRolePermissions(roleId) {
      return DEFAULT_PERMISSIONS[roleId] || {};
    },
  };
}