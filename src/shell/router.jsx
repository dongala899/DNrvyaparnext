import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '../shared/components/AppLayout.jsx';

const moduleRoutes = [];

let router = null;

export function createRouter() {
  return {
    register(routes) {
      moduleRoutes.push(...routes);
    },

    getRoutes() {
      return [...moduleRoutes];
    },

    buildRouter() {
      const authPaths = ['/login', '/register'];
      const authRoutes = moduleRoutes.filter(r => authPaths.includes(r.path));
      const appRoutes = moduleRoutes.filter(r => !authPaths.includes(r.path));

      const wrapElement = (el) => {
        if (typeof el === 'function') return React.createElement(el);
        if (React.isValidElement(el)) return el;
        return el;
      };

      const authChildren = authRoutes.map((route) => ({
        path: route.path,
        element: wrapElement(route.element),
      }));

      const appChildren = appRoutes.map((route) => ({
        path: route.path,
        element: wrapElement(route.element),
      }));

      router = createBrowserRouter([
        ...authChildren,
        {
          path: '/',
          element: <AppLayout />,
          children: [...appChildren, { path: '*', element: <Navigate to="/login" replace /> }],
        },
      ], {
        basename: '/',
      });

      return router;
    },

    getRouter() {
      return router;
    },

    navigate(path) {
      if (router) {
        router.navigate(path);
      }
    },

    render() {
      if (!router) {
        this.buildRouter();
      }
      return <RouterProvider router={router} />;
    },
  };
}
