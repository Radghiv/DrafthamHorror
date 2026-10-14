import React from 'react'

export function CheckIcon(props) {
    const size = props.size || 18

    return (
        <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 9.5 7 13.5 15 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function WarningIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M9 3 16 15H2Z M9 7.5v3.5 M9 12.8v.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function SunIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M11 2v2.5M11 17.5V20M2 11h2.5M17.5 11H20M4.6 4.6l1.8 1.8M15.6 15.6l1.8 1.8M4.6 17.4l1.8-1.8M15.6 6.4l1.8-1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

export function MoonIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M18 13.5A7.5 7.5 0 0 1 8.5 4a7.5 7.5 0 1 0 9.5 9.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    )
}

export function AllIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <rect x="2.5" y="2.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5.5 9.3 8 11.8 12.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function NoneIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <rect x="2.5" y="2.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    )
}

// The auto-fail chaos token's tentacle, for the Arkham theme: the glyph of the arkham-icons font that ArkhamDB uses for
// the auto-fail symbol (font coordinates, y pointing up, hence the flip)
const AUTO_FAIL_PATH = 'M142.336 178.176q-82.944-14.336-82.944-70.656 0-7.168 1.024-15.36l22.528-59.392h-2.048l-28.672 27.648q-30.72 30.72-30.72 55.296 0 11.264 6.144 20.48 18.432 32.768 21.504 39.936t6.144 12.8 7.168 8.704l19.456 16.384q54.272 29.696 80.896 29.696l29.696 4.096 51.2-19.456 50.176-15.36 25.6-16.384q23.552-12.288 40.96-46.080l1.024-1.024 29.696-61.44q15.36-23.552 15.36-38.912v-3.072l4.096-40.96v-8.192l1.024-9.216 1.024-23.552-26.624-37.888-14.336-24.576v-2.048l-1.024-1.024q-8.192 0-12.288 7.168l-67.584 67.584q-7.168 11.264-7.168 17.408v2.048l4.096 23.552q0 54.272-17.408 77.824l-38.912 43.008-21.504 16.384-23.552 11.264q-8.192 4.096-15.36 6.144zM370.688 566.272q-49.152 0-49.152-43.008l-17.408-52.224 16.384-38.912 6.144-16.384 25.6-24.576 16.384-24.576 26.624-16.384q6.144 0 39.936-22.528l31.744-27.648 26.624-35.84 7.168-14.336 3.072-23.552q0-6.144 3.072-10.24v-1.024q6.144-7.168 6.144-34.816l-54.272-73.728-18.432-45.056q-1.024-1.024-5.632-1.024t-17.92 56.32l-35.84 54.272-30.72 32.768-25.6 12.288q0 15.36-18.432 15.36l-10.24 4.096q-1.024 0-13.312 3.072l-20.48 8.192-10.24 3.072h-7.168q-2.048-1.024-4.096-1.024l-8.192 4.096-35.84 28.672-15.36 11.264v1.024l-22.528 27.648v2.048l-22.528 34.816-13.312 48.128v17.408l-3.072 44.032 7.168 21.504 1.024 22.528 29.696 73.728 17.408 24.576q10.24 19.456 24.576 33.792l22.528 29.696 10.24 5.12 24.576 19.456 35.84 12.288 28.672 8.192 50.176 6.144 24.576-8.192 55.296-22.528 28.672-20.48 27.648-34.816q19.456-14.336 20.48-25.6l11.264-39.936v-43.008l-4.096-30.72q0-15.36-13.312-28.672l-20.48-26.624-1.024-1.024-43.008-27.648q-17.408-6.144-21.504-6.144h-2.048v1.024q17.408 29.696 21.504 40.96v59.392l-20.48 30.72q-15.36 24.576-64.512 24.576zM834.56 34.816l27.648-5.12q66.56 10.24 84.992 34.816h2.048l2.048-2.048v-2.048l-10.24-22.528q-11.264-20.48-25.6-26.624l-27.648-17.408q-3.072-1.024-21.504-5.12l-29.696-5.12q-4.096 1.024-26.624 1.024l-20.48-3.072-49.152 2.048-32.768 6.144-18.432-2.048q-8.192 3.072-21.504 3.072t-30.72-3.072l-23.552-5.12q-11.264-4.096-24.576-10.24l-18.432-12.288-27.648-24.576-20.48-27.648-11.264-30.72-1.024-3.072q-2.048-1.024-16.384-15.36l-27.648-28.672q-5.12-5.12-11.264-5.12-13.312 0-34.816 22.528-30.72 32.768-30.72 45.056l66.56 77.824q0 1.024 17.408 18.432 18.432 17.408 24.576 17.408l66.56 41.984 20.48 7.168 30.72 15.36 20.48 2.048h11.264l33.792-1.024 21.504-2.048 21.504-4.096 68.608-24.576 37.888-6.144h4.096zM632.832 93.184q-19.456 0-50.176-15.36l-48.128-22.528-77.824-52.224q-2.048-1.024-3.584-1.024t-1.536 1.024v1.024q0 33.792 4.096 44.032l17.408 39.936 23.552 36.864 27.648 28.672 14.336 16.384q37.888 49.152 69.632 49.152l51.2 28.672q15.36 0 20.48 8.192l22.528 28.672q17.408 36.864 17.408 72.704 0 22.528-31.744 22.528h-3.072q-18.432 0-47.104-6.144l-24.576-14.336-1.024-1.024h-1.024l-17.408-23.552q-3.072-2.048-4.096-2.048t-1.024 2.048v1.024l2.048 34.816 3.072 12.288 6.144 17.408q0 12.288 6.144 19.456l29.696 26.624 37.888 17.408q13.312 9.216 26.624 9.216l25.6-3.072 28.672 4.096q21.504 0 57.344-47.104l13.312-19.456 12.288-30.72q4.096-4.096 4.096-13.312l3.072-48.128-4.096-22.528q0-6.144-21.504-63.488l-33.792-45.056-31.744-30.72q-5.12-6.144-8.192-7.168l-1.024-1.024h-1.024l-71.68-51.2q-4.096 0-12.288-1.024h-26.624z'

export function AutoFailIcon() {
    return (
        <svg width="24" height="22" viewBox="21.504 -724.992 929.792 900.096" aria-hidden="true" fill="currentColor">
            <g transform="scale(1 -1)"><path d={AUTO_FAIL_PATH} /></g>
        </svg>
    )
}

// The Elder Sign, for the Innsmouth theme: the glyph of the arkham-icons font that ArkhamDB uses for the elder sign
// (font coordinates, y pointing up, hence the flip)
const ELDER_SIGN_PATH = 'M963-42L963-42L953-42L848-12Q800 1 665 53L665 53Q529 104 464 137L464 137L357 195L336 208Q323 214 327 226L327 226Q327 233 342 227L342 227Q356 221 369 217L369 217Q382 213 392 209L392 209Q402 205 415 201L415 201Q427 197 455 182L455 182Q483 168 513 161L513 161L588 142L589 143L589 144L584 150L584 152L588 152Q594 147 604 145L604 145L631 139Q645 136 647 136L647 136L645 142L646 142L648 143L650 142L759 119L761 119L761 121L697 268L716 284L727 290L737 298Q738 298 785 251L785 251Q831 205 909 60L909 60L962-35Q965-42 963-42L963-42ZM336-159L336-159L336-176Q336-178 335-179L335-179L334-179L308-143L307-143L307-144Q305-146 307-150L307-150L322-215Q324-221 323-227L323-227L313-219Q310-217 284-178L284-178Q230-101 230 22L230 22Q230 23 232 23L232 23L232 22L247-24Q259-36 249-15L249-15L247 3L246 22L244 76L247 136L252 193L260 259L268 319Q281 395 285 395L285 395L290 395L307 393Q321 393 321 382L321 382Q321 369 315 338L315 338Q310 302 309 262L309 262Q309 239 311 213L311 213L314 157L318 127Q318 121 324 75L324 75L323 74L323 73L315 78L313 76Q313 74 315 66L315 66L321 51Q325 47 337 66L337 66Q349 85 377 119L377 119Q404 153 407 154L407 154Q409 156 417 145L417 145L468 106L418 41Q336-63 336-159L336-159ZM185 413L185 413Q199 407 199 401L199 401Q199 398 194 398L194 398Q183 398 155 410L155 410L151 410L183 378L224 344Q230 338 245 330L245 330Q259 322 256 311L256 311L249 274Q244 274 207 303L207 303Q63 411 23 538L23 538Q18 549 25 549L25 549L36 544Q71 514 182 484L182 484Q293 455 349 450L349 450L419 440Q427 438 433 438L433 438L456 437L486 434L532 432Q543 432 571 403L571 403L570 401L503 399L416 401L376 406L349 408Q288 408 242 423L242 423Q196 438 189 438L189 438L188 437L188 436L253 412Q253 402 226 412L226 412L189 415Q187 415 186 414L186 414L185 414L185 413ZM422 495L422 494Q419 494 417 496L417 496L404 505Q376 529 368 529L368 529Q365 526 355 501L355 501Q346 475 346 473L346 473Q346 461 338 463L338 463L296 473L298 483L301 494L306 515L312 537L317 557L352 685Q353 694 357 706L357 706L359 705L361 705Q364 702 364 707L364 707L365 730L366 731L366 733L367 734L368 734Q369 733 371 730L371 730L386 698Q441 589 489 564L489 564Q493 561 487 561L487 561Q478 561 478 559L478 559L498 544Q569 495 623 438L623 438Q673 386 673 379L673 379Q673 368 653 368L653 368Q648 368 645 372L645 372Q635 382 629 386L629 386Q623 389 615 395L615 395Q605 404 585 416L585 416L473 496L472 496L472 495L478 485Q481 479 482 478L482 478L482 477L481 477L416 521Q413 518 422 495L422 495ZM664 430L664 430L674 430L693 433Q701 433 701 436L701 436L693 441L693 443L702 445L756 454Q762 455 798 461L798 461L816 464Q820 464 818 468L818 468L816 470L835 477L953 510Q955 510 962 512L962 512L963 511L963 510L913 465Q842 396 729 317L729 317Q616 238 590 214L590 214Q564 189 549 176L549 176Q534 162 527 167L527 167Q520 172 520 179L520 179Q520 187 528 197L528 197L574 246L715 374L734 398L740 411L740 414L699 413Q680 413 674 418L674 418L665 427Q664 427 664 430L664 430ZM530 306L520 251L527 227Q518 225 509 225L509 225Q464 225 431 266L431 266Q416 282 416 299L416 299Q416 323 443 350L443 350L443 349L444 348L445 329Q445 317 453 311L453 311Q460 304 460 310L460 310Q473 333 473 353L473 353Q473 372 462 387L462 387Q463 395 483 380L483 380Q530 346 530 306L530 306ZM458 228L458 228Q436 220 415 220L415 220Q379 220 344 244L344 244Q314 263 314 277L314 277Q314 291 326 315L326 315Q337 340 372 353L372 353Q408 366 419 366L419 366L402 342Q388 315 388 295L388 295Q388 268 414 253L414 253L429 244Q438 240 439 236L439 236L458 229L458 228ZM543 369L543 369L558 369L566 370Q569 370 566 376L566 376Q566 385 577 385L577 385Q589 385 615 373L615 373L625 367Q636 358 636 335L636 335Q636 311 627 305L627 305L599 286Q563 255 552 255L552 255L535 256L567 290Q570 291 572 299L572 299L575 310Q579 319 572 335L572 335Q565 350 520 359L520 359Q529 369 543 369L543 369Z'

export function ElderSignIcon() {
    return (
        <svg width="22" height="22" viewBox="20.922 -734 942.878 961" aria-hidden="true" fill="currentColor">
            <g transform="scale(1 -1)"><path d={ELDER_SIGN_PATH} /></g>
        </svg>
    )
}

// Redraw: two arrows chasing each other around a circle
export function RedrawIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8.5A7.5 7.5 0 0 0 4.6 6.6" />
            <path d="M4.2 2.8v4.1h4.1" />
            <path d="M4 13.5a7.5 7.5 0 0 0 13.4 1.9" />
            <path d="M17.8 19.2v-4.1h-4.1" />
        </svg>
    )
}

// External link: an arrow leaving a box, for the links that open ArkhamDB in a new tab
export function ExternalLinkIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 3h6v6" />
            <path d="M19 3l-8 8" />
            <path d="M17 13v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 17.5v-10A1.5 1.5 0 0 1 5.5 6H9" />
        </svg>
    )
}

// A gear (a toothed wheel with a hole), for the settings button
export function SettingsIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M9.76 3.91 L9.94 1.36 L12.06 1.36 L12.24 3.91 A 7.2 7.2 0 0 1 15.14 5.11 L17.06 3.43 L18.57 4.94 L16.89 6.86 A 7.2 7.2 0 0 1 18.09 9.76 L20.64 9.94 L20.64 12.06 L18.09 12.24 A 7.2 7.2 0 0 1 16.89 15.14 L18.57 17.06 L17.06 18.57 L15.14 16.89 A 7.2 7.2 0 0 1 12.24 18.09 L12.06 20.64 L9.94 20.64 L9.76 18.09 A 7.2 7.2 0 0 1 6.86 16.89 L4.94 18.57 L3.43 17.06 L5.11 15.14 A 7.2 7.2 0 0 1 3.91 12.24 L1.36 12.06 L1.36 9.94 L3.91 9.76 A 7.2 7.2 0 0 1 5.11 6.86 L3.43 4.94 L4.94 3.43 L6.86 5.11 A 7.2 7.2 0 0 1 9.76 3.91 Z" />
            <circle cx="11" cy="11" r="3.1" />
        </svg>
    )
}

// The phone dock's icons: the investigator, the card lists and Undo
export function PersonIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="7" r="3.6" />
            <path d="M4 19c.6-3.8 3.4-5.6 7-5.6s6.4 1.8 7 5.6" />
        </svg>
    )
}

export function ListIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 5.5h11M8 11h11M8 16.5h11" />
            <path d="M3.5 5.5h.01M3.5 11h.01M3.5 16.5h.01" />
        </svg>
    )
}

export function UndoIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4.5 4 8.5l4 4" />
            <path d="M4.5 8.5h8a5 5 0 0 1 0 10H9" />
        </svg>
    )
}

// A magnifying glass with a plus: shows a card larger
export function ZoomIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="9.5" cy="9.5" r="5.5" />
            <path d="m13.8 13.8 5 5M9.5 7.2v4.6M7.2 9.5h4.6" />
        </svg>
    )
}

// two chevrons moving toward each other (fold everything up) and away from each other (unfold everything)
export function FoldAllIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 3.5 10 8.5 15 3.5 M5 16.5 10 11.5 15 16.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function UnfoldAllIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 8.5 10 3.5 15 8.5 M5 11.5 10 16.5 15 11.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
