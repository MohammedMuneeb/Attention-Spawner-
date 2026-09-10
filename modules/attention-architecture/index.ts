// Re-export the native module. On web, it will be resolved to AttentionArchitectureModule.web.ts
// and on native platforms to AttentionArchitectureModule.ts
export { default } from './src/AttentionArchitectureModule';
export * from './src/AttentionArchitecture.types';
