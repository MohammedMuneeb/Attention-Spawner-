package expo.modules.mytestmodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyTestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyTestModule")
  }
}
