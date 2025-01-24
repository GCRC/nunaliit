; (function ($, $n2) {
    "use strict";

    var datepickerElement

    $.datepicker.setDefaults({
        beforeShow: beforeShowDatePicker
    });

    function beforeShowDatePicker(element) {
        datepickerElement = element
        setTimeout(function () {
            var today = $('.ui-datepicker-current-day a')[0] || $(".ui-datepicker-today a")[0];

            if (!today) {
                today = $("a.ui-state-default")[0];
            }

            // Hide the "today" button because it doesn't do what
            // you think it supposed to do
            hideTodayButton();
            today.focus();
            datePickHandler();
            $(document).on(
                "click",
                "#ui-datepicker-div .ui-datepicker-close",
                function () {
                    closeCalendar();
                }
            );
        }, 0);
    }

    function hideTodayButton() {
        $(".ui-datepicker-current").hide();
    }

    function datePickHandler() {
        const container = document.getElementById("ui-datepicker-div");

        if (!container) return;

        initilizeContainer(container);
        setupNavigationButtons(container);
        addKeyboardListeners(container);
        updateDateLabels();
    }

    function initilizeContainer(container) {
        container.setAttribute("role", "application");
        container.setAttribute("aria-label", "Calendar view date-picker");
    }

    function setupNavigationButtons(container) {
        const prev = $(".ui-datepicker-prev", container)[0];
        const next = $(".ui-datepicker-next", container)[0];

        if (prev && next) {
            configureButton(prev, handlePrevClicks);
            configureButton(next, handleNextClicks);
        }
    }

    function configureButton(button, clickHandler) {
        button.href = "javascript:void(0)";
        button.setAttribute("role", "button");
        button.removeAttribute("title");
        $(button).on("click", clickHandler);

    }

    function addKeyboardListeners(container) {
        $(container).on("keydown", (event) => {
          const { which, target, shiftKey } = event;
          const navigationHandlers = {
            27: closeCalendar, // ESC
            9: () => handleTabNavigation(event, target, shiftKey), // TAB
            37: () => handleArrowNavigation(event, target, previousDay), // LEFT
            39: () => handleArrowNavigation(event, target, nextDay), // RIGHT
            38: () => handleVerticalNavigation(target, upHandler, container), // UP
            40: () => handleVerticalNavigation(target, downHandler, container), // DOWN
            13: () => handleEnterKey(target), // ENTER
            32: () => handleSpaceKey(target), // SPACE
            33: () => moveOneMonth(target, "prev"), // PAGE UP
            34: () => moveOneMonth(target, "next"), // PAGE DOWN
            36: () => focusFirstOfMonth(target), // HOME
            35: () => focusLastOfMonth(target) // END
          };

          navigationHandlers[which]?.();
        });
      }

    function handleTabNavigation(event, target, shiftKey) {
        event.preventDefault();

        // Define the focusable elements in order
        const focusOrder = [
            ".ui-datepicker-close",
            "a.ui-state-default",
            ".ui-datepicker-year",
            ".ui-datepicker-next",
            ".ui-datepicker-prev",
        ];

        // Find the current index of the focused element
        const currentIndex = focusOrder.findIndex((selector) =>
            $(target).is(selector)
        );

        // Calculate the next index based on Shift key for reverse navigation
        const nextIndex = shiftKey
            ? (currentIndex - 1 + focusOrder.length) % focusOrder.length
            : (currentIndex + 1) % focusOrder.length;

        // Find the next element to focus
        const nextElement = $(focusOrder[nextIndex]).first();
        if (nextElement.length) {
            nextElement.focus();
        }
    }

    function handleArrowNavigation(event, target, navigationHandler) {
        if ($(target).hasClass("ui-state-default")) {
            event.preventDefault();
            navigationHandler(target);
        }
    }

    function handleVerticalNavigation(target, handler, container) {
        if ($(target).hasClass("ui-state-default")) {
            handler(target, container);
        } else if ($(target).hasClass("ui-datepicker-year")) {
            setTimeout(function () {
                // updating the cached header elements
                updateHeaderElements();
                hideTodayButton();
                $(".ui-datepicker-year").focus();
            }, 0);
        }
    }

    function handleEnterKey(target) {
        if ($(target).hasClass("ui-state-default")) {
            setTimeout(closeCalendar, 100);
        } else if ($(target).hasClass("ui-datepicker-prev")) {
            handlePrevClicks();
        } else if ($(target).hasClass("ui-datepicker-next")) {
            handleNextClicks();
        }
    }

    function handleSpaceKey(target) {
        if (
            $(target).hasClass("ui-datepicker-prev") ||
            $(target).hasClass("ui-datepicker-next")
        ) {
            target.click();
        }
    }

    function moveOneMonth(target, dir) {
        const button =
            dir === "next"
                ? $(".ui-datepicker-next")[0]
                : $(".ui-datepicker-prev")[0];

        if (!button) return;

        const ENABLED_SELECTOR = "#ui-datepicker-div tbody td:not(.ui-state-disabled)";
        const currentCells = $(ENABLED_SELECTOR);
        var currentIdx = $.inArray(target.parentNode, currentCells);

        button.click();
        setTimeout(function () {
            updateHeaderElements();

            const newCells = $(ENABLED_SELECTOR);
            let newTd = newCells[currentIdx];
            let newAnchor = newTd && $(newTd).find("a")[0];

            while (!newAnchor) {
                currentIdx--;
                newTd = newCells[currentIdx];
                newAnchor = newTd && $(newTd).find("a")[0];
            }

            newAnchor.focus();
        }, 0);
    }

    function focusFirstOfMonth(target) {
        const firstOfMonth = $(target)
            .closest("tbody")
            .find(".ui-state-default")[0];
        if (firstOfMonth) {
            firstOfMonth.focus();
        }
    }

    function focusLastOfMonth(target) {
        const daysOfMonth = $(target).closest("tbody").find(".ui-state-default");
        const lastDay = daysOfMonth[daysOfMonth.length - 1];
        if (lastDay) {
            lastDay.focus();
        }
    }

    /**
     * Handles right arrow key navigation
     * @param  {HTMLElement} dateLink The target of the keyboard event
     */
    function nextDay(dateLink) {
        if (!dateLink) return;

        var td = $(dateLink).closest("td");
        if (!td) return;

        const nextTd = $(td).next();
        const nextDateLink = $("a.ui-state-default", nextTd)[0];

        if (nextTd && nextDateLink) {
            nextDateLink.focus(); // the next day (same row)
        } else {
            handleNext(dateLink);
        }
    }

    function handleNext(target) {
        if (!target) return;

        const currentRow = $(target).closest("tr");
        const nextRow = $(currentRow).next();

        if (!nextRow || nextRow.length === 0) {
            nextMonth();
        } else {
            const nextRowFirstDate = $("a.ui-state-default", nextRow)[0];
            if (nextRowFirstDate) {
                nextRowFirstDate.focus();
            }
        }
    }

    function nextMonth() {
        const nextMon = $(".ui-datepicker-next")[0];
        const container = document.getElementById("ui-datepicker-div");
        nextMon.click();
        // focus the first day of the new month
        setTimeout(function () {
            // updating the cached header elements
            updateHeaderElements();

            const firstDate = $("a.ui-state-default", container)[0];
            firstDate.focus();
        }, 0);
    }

    function previousDay(dateLink) {
        if (!dateLink) return;

        var td = $(dateLink).closest("td");
        if (!td) return;

        const prevTd = $(td).prev();
        const prevDateLink = $("a.ui-state-default", prevTd)[0];

        if (prevTd && prevDateLink) {
            prevDateLink.focus();
        } else {
            handlePrevious(dateLink);
        }
    }

    function handlePrevious(target) {
        if (!target) return;

        const currentRow = $(target).closest("tr");
        if (!currentRow) return;

        const previousRow = $(currentRow).prev();

        if (!previousRow || previousRow.length === 0) {
            // there is not previous row, so we go to previous month...
            previousMonth();
        } else {
            const prevRowDates = $("td a.ui-state-default", previousRow);
            const prevRowDate = prevRowDates[prevRowDates.length - 1];

            if (prevRowDate) {
                setTimeout(function () {
                    prevRowDate.focus();
                }, 0);
            }
        }
    }

    function previousMonth() {
        const prevLink = $(".ui-datepicker-prev")[0];
        const container = document.getElementById("ui-datepicker-div");
        prevLink.click();
        // focus last day of new month
        setTimeout(function () {
            const trs = $("tr", container);
            const lastRowTdLinks = $("td a.ui-state-default", trs[trs.length - 1]);
            const lastDate = lastRowTdLinks[lastRowTdLinks.length - 1];

            // updating the cached header elements
            updateHeaderElements();
            lastDate.focus();
        }, 0);
    }

    /**
     * Handle the up arrow navigation through dates
     * @param  {HTMLElement} target   The target of the keyboard event (day)
     * @param  {HTMLElement} cont     The calendar container
     */
    function upHandler(target, cont) {
        const prevLink = $(".ui-datepicker-prev")[0];
        const rowContext = $(target).closest("tr");
        if (!rowContext) return;

        const rowTds = rowContext.find("td");
        const rowLinks = rowContext.find("a.ui-state-default");
        const targetIndex = rowLinks.index(target);
        const prevRow = rowContext.prev();

        if (prevRow.length) {
            const prevRowTds = prevRow.find("td");
            const parallel = prevRowTds.eq(targetIndex);
            const linkCheck = parallel.find("a.ui-state-default")[0];

            if (linkCheck) {
                linkCheck.focus();
                return;
            }
        }

        prevLink.click();
        setTimeout(() => {
            updateHeaderElements();

            const newRows = $('tr', cont);
            const lastRow = newRows.last();
            const tdParallelIndex = rowTds.index(target.parentNode);
            const newParallel = lastRow.find("td").eq(tdParallelIndex);
            const newCheck = newParallel.find("a.ui-state-default")[0];

            if (newCheck) {
                newCheck.focus();
                return;
            }

            const secondLastRow = newRows.eq(-2);
            const targetTd = secondLastRow.find("td").eq(tdParallelIndex);
            const linkCheck = targetTd.find("a.ui-state-default")[0];

            if (linkCheck) {
                linkCheck.focus();
            }
        }, 0);
    }

    /**
     * Handles down arrow navigation through dates in calendar
     * @param  {HTMLElement} target   The target of the keyboard event (day)
     * @param  {HTMLElement} cont     The calendar container
     */
    function downHandler(target, cont) {
        const nextLink = $(".ui-datepicker-next")[0];
        const targetRow = $(target).closest("tr");

        if (!targetRow.length) return;

        const targetCells = targetRow.find("td");
        const cellIndex = targetCells.index(target.parentNode);
        const nextRow = targetRow.next();

        if (nextRow.length) {
            const nextRowCells = nextRow.find("td");
            const nextWeekTd = nextRowCells.eq(cellIndex);
            const nextWeekCheck = nextWeekTd.find("a.ui-state-default")[0];

            if (nextWeekCheck) {
                nextWeekCheck.focus();
                return;
            }
        }

        nextLink.click();
        setTimeout(() => {
            updateHeaderElements();

            const nextMonthTrs = $("tbody tr", cont);
            const firstTds = nextMonthTrs.first().find("td");
            const firstParallel = firstTds.eq(cellIndex);
            const firstCheck = firstParallel.find("a.ui-state-default")[0];

            if (firstCheck) {
                firstCheck.focus();
                return;
            }

            const secondRow = nextMonthTrs.eq(1);
            const secondRowTd = secondRow.find("td").eq(cellIndex);
            const secondCheck = secondRowTd.find("a.ui-state-default")[0];

            if (secondCheck) {
                secondCheck.focus();
            }
        }, 0);
    }

    /**
     * Updates the ARIA labels for the datepicker dates to improve accessibility.
     */
    function updateDateLabels() {
        const datePickDiv = document.getElementById("ui-datepicker-div");
        if (!datePickDiv) return;

        $("a.ui-state-default", datePickDiv).each((index, date) => {
            const monthName = $(".ui-datepicker-month", datePickDiv).text();
            const year = $(".ui-datepicker-year", datePickDiv).val();
            const dayNumber = date.textContent;
            const dayTitle = $("thead tr th", datePickDiv).eq(index).find("span").attr("title");

            if (dayNumber && monthName && year && dayTitle) {
                date.setAttribute("aria-label", `${dayNumber} ${monthName} ${year} ${dayTitle}`);
            }
        });
    }

    /**
     * Updates the header elements (e.g., navigation buttons) and recalculates accessibility features.
     */
    function updateHeaderElements() {
        const datepickerDiv = document.getElementById("ui-datepicker-div");
        if (!datepickerDiv) return;

        const prevButton = $(".ui-datepicker-prev", datepickerDiv)[0];
        const nextButton = $(".ui-datepicker-next", datepickerDiv)[0];

        if (prevButton && nextButton) {
            [prevButton, nextButton].forEach(button => {
                button.href = "javascript:void(0)";
                button.setAttribute("role", "button");
            });

            $(nextButton).on("click", handleNextClicks);
            $(prevButton).on("click", handlePrevClicks);
        }

        updateDateLabels();
    }

    function closeCalendar() {
        $("#ui-datepicker-div").off("keydown");
        datepickerElement?.focus();
    }

    function handleNextClicks() {
        setTimeout(function () {
            updateHeaderElements();
            $(".ui-datepicker-next").focus();
            hideTodayButton();
        }, 0);
    }

    function handlePrevClicks() {
        setTimeout(function () {
            updateHeaderElements();
            $(".ui-datepicker-prev").focus();
            hideTodayButton();
        }, 0);
    }
})(jQuery, nunaliit2);