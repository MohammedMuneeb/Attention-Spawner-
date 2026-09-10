import { registerWebModule, NativeModule } from 'expo';

class MyTestModule extends NativeModule<{}> {}

export default registerWebModule(MyTestModule, 'MyTestModule');
