import { NativeModule, requireNativeModule } from 'expo';

declare class MyTestModule extends NativeModule<{}> {}

export default requireNativeModule<MyTestModule>('MyTestModule');
