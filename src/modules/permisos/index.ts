// src/modules/permisos/index.ts

export * from './types/permission.types';
export * from './dto/create-permission.dto';
export * from './dto/update-permission.dto';
export * from './dto/permission-response.dto';
export * from './validators/permission.validator';
export * from './repositories/permission.repository';
export * from './services/permission.service';
export * from './hooks/use-permissions';
export * from './api/permission.router';
export * from './components/PermissionTable';
export * from './components/PermissionForm';
export * from './components/AssignPermissionModal';
