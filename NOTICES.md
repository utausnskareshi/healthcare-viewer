# NOTICES — Third-Party Software

This project bundles unmodified copies of the following open-source libraries
under `docs/vendor/`. Each library remains the property of its respective
authors and is redistributed in compliance with its license. License headers
are preserved inside the minified files themselves; the relevant terms are
also reproduced below for convenience.

---

## Chart.js

- Version: **4.4.4**
- Files: `docs/vendor/chart/chart.umd.min.js`
- Source: https://github.com/chartjs/Chart.js
- Copyright: (c) 2014-2024 Chart.js Contributors
- License: **MIT**

```
The MIT License (MIT)

Copyright (c) 2014-2024 Chart.js Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## chartjs-adapter-date-fns

- Version: **3.0.0**
- Files: `docs/vendor/chart/chartjs-adapter-date-fns.bundle.min.js`
- Source: https://github.com/chartjs/chartjs-adapter-date-fns
- Copyright: (c) 2022 chartjs-adapter-date-fns Contributors
- License: **MIT** (same terms as Chart.js above)

This bundle also includes [date-fns](https://date-fns.org/), licensed under
the MIT License (Copyright (c) 2014–present Sasha Koss and Lesha Koss).

---

## Leaflet

- Version: **1.9.4**
- Files: `docs/vendor/leaflet/leaflet.js`, `leaflet.css`, `images/*.png`
- Source: https://github.com/Leaflet/Leaflet
- Copyright: (c) 2010–2023 Vladimir Agafonkin, (c) 2010–2011 CloudMade
- License: **BSD-2-Clause**

```
Copyright (c) 2010-2023, Volodymyr Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

---

## fflate

- Version: **0.8.2**
- Files: `docs/vendor/fflate/fflate.min.js`
- Source: https://github.com/101arrowz/fflate
- Copyright: (c) 2023 Arjun Barrett
- License: **MIT**

```
MIT License

Copyright (c) 2023 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Map Tiles — OpenStreetMap

The PWA fetches map tiles at runtime from
`https://tile.openstreetmap.org/`.

- Map data: © [OpenStreetMap](https://www.openstreetmap.org/) contributors,
  available under the [Open Data Commons Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).
- Cartography: © OpenStreetMap, available under the
  [Creative Commons Attribution-ShareAlike 2.0 license (CC BY-SA 2.0)](https://creativecommons.org/licenses/by-sa/2.0/).

The required attribution "© OpenStreetMap contributors" is shown on every
map rendered by the app via Leaflet's standard attribution control.

If you fork or self-host this project, please respect OpenStreetMap's
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).

---

## Apple HealthKit Identifiers and Trademarks

This software reads files exported from Apple's Health.app. Identifiers such
as `HKQuantityTypeIdentifierStepCount` are part of Apple's public HealthKit
data format and are referenced solely for interoperability. "Apple",
"iPhone", "iPad", "Apple Watch", "HealthKit" and related marks are
trademarks of Apple Inc., used here for descriptive purposes only. This
project is not affiliated with or endorsed by Apple Inc.

---

## App Icons

The application icons in `docs/icons/` are original artwork generated for
this project (see `scripts/gen_icons.py`) and are released together with the
source code under the project's MIT license.
