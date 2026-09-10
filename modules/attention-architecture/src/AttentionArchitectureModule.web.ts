import { registerWebModule, NativeModule } from 'expo';

// AttentionArchitectureModule is not available on the web platform.
class AttentionArchitectureModule extends NativeModule<{}> {}

export default registerWebModule(AttentionArchitectureModule, 'AttentionArchitectureModule');
