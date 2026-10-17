/** Installs platform adapters into @mindcocoon/core before any screen renders. */
import { setStorage } from "@mindcocoon/core/storage/index";
import { createMobileAdapter } from "./lib/storage";

setStorage(createMobileAdapter());
