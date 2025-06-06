import { commands, i18nFixture, CustomFixture } from "@neetoplaywright";
import { test } from "@playwright/test";

import { Poms, poms } from "./poms";

export default test
  .extend<CustomFixture>(commands)
  .extend(i18nFixture)
  .extend<Poms>(poms);
