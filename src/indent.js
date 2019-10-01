var Indent = function (config) {
    this.stepIndent = 7;
    this.widerTables = false;

    if (config && config.stepIndent)
        this.stepIndent = config.stepIndent;

    if (config && config.widerTables)
        this.widerTables = config.widerTables;

    this.originalText = "";
    this.lines = [];
    this.languageIndex = '0';
    this.lineEndings = '\r\n';
    var words = {
        scenario: ['Scenario'],
        background: ['Background'],
        given: ['Given'],
        when: ['When'],
        then: ['Then'],
        and: ['And'],
        but: ['But'],
        examples: ['Examples'],
    };

    var activeWords = {
        scenario: words.scenario[this.languageIndex],
        background: words.background[this.languageIndex],
        given: words.given[this.languageIndex],
        when: words.when[this.languageIndex],
        then: words.then[this.languageIndex],
        and: words.and[this.languageIndex],
        but: words.but[this.languageIndex],
        examples: words.examples[this.languageIndex],
    }

    this.init = function (originalText) {
        var formatedText = '';
        this.originalText = originalText;
        // Figure out the line ending type
        if(this.originalText.match(/\r\n/) === null) {
            this.lineEndings = '\n';
        }
        
        this.lines = this.originalText.split(this.lineEndings);
        if (this.lines[this.lines.length - 1].indexOf('|') !== -1)
            this.lines.push(" ");
    }

    this.format = function (originalText) {
        this.init(originalText);
        this.formatSteps();

        var tables = this.extract();
        var formattedTables = [];
        tables.forEach(function (table) {
            var formattedTable = this.formatTableRows(table);
            formattedTable.forEach(function (element) {
                this.lines[element.lineNumber] = element.value;
            }, this);
        }, this);

        formatedText = this.lines.join(this.lineEndings);
        return formatedText;
    }

    this.extract = function () {
        var tables = [];
        var rows = [];
        this.lines.forEach(function (line, index) {
            if (line.indexOf('|') !== -1) {
                rows.push({ value: line, lineNumber: index });
                if (index + 1 < this.lines.length && this.lines[index + 1].indexOf('|') === -1) {
                    tables.push(rows);
                    rows = [];
                }
            }
        }, this);
        return tables;
    }

    this.formatSteps = function () {
        var firstOccurrence;
        this.lines.forEach(function (line, index) {
            if (this.isValidStep(line, activeWords.given)) {
                this.lines[index] = this.leftPad(line, activeWords.given);
            } else if (this.isValidStep(line, activeWords.when)) {
                this.lines[index] = this.leftPad(line, activeWords.when);
            } else if (this.isValidStep(line, activeWords.then)) {
                this.lines[index] = this.leftPad(line, activeWords.then);
            } else if (this.isValidStep(line, activeWords.and)) {
                this.lines[index] = this.leftPad(line, activeWords.and);
            } else if (this.isValidStep(line, activeWords.but)) {
                this.lines[index] = this.leftPad(line, activeWords.but);
   
            } else if (this.isValidStep(line, activeWords.scenario)) {
                this.lines[index] = this.leftPad(line, activeWords.scenario);
            } else if (this.isValidStep(line, activeWords.background)) {
                this.lines[index] = this.leftPad(line, activeWords.background);
            } else if (this.isValidStep(line, activeWords.examples)) {
                this.lines[index] = this.leftPad(line, activeWords.examples);
            }
        }, this);
    }

    this.isValidStep = function (line, stepName) {
        var pattern = /^[\s\r\t\n]+$/;
        if (line.indexOf(stepName) !== -1) {
            var first = line.substr(0, line.indexOf(stepName));
            if (first.length === 0) return true;
            if (pattern.test(first)) return true;
        }
        return false;
    }


    this.formatTableRows = function (rows) {
        var columns = [], indexes = [], i, j, max;
        rows.forEach(function (element, index) {
            if (this.isValidStep(element.value, "|")) {
                var newstrings = element.value.match(/(?=\S)[^\|]+?(?=\s*(\||$))/g);
                newstrings.splice(0, 0,"");
                newstrings.push("");
                columns.push(newstrings);
                indexes.push(index);
            };
        }, this);

        for (i = 0; i < columns[0].length; i++) {
            max = this.longest(i, columns);
            if (max > 0) {
                for (j = 0; j < columns.length; j++) {
                    var newValue;

                    if (this.widerTables) {
                        newValue = this.centerPad(columns[j][i], max - columns[j][i].length + 2)
                    } else {
                        newValue = this.centerPad(columns[j][i], max - columns[j][i].length)
                    }

                    columns[j][i] = newValue;
                }
            }
        }

        for (i = 0; i < indexes.length; i++) {
            rows[indexes[i]].value = this.leftPadAmount(columns[i].join('|'), this.stepIndent);
        }

        return rows;
    }

    this.longest = function (col, elements) {
        var max = elements[0][col].length;
        for (var i = 1; i < elements.length; i++) {
            if (elements[i][col].length > max) max = elements[i][col].length;
        }
        return max;
    }

    this.centerPad = function (str, count) {
        if (count > 0) {
            var start = Math.ceil(count / 2);
            var end = Math.floor(count / 2);
            return Array(start + 1).join(" ") + str + Array(end + 1).join(" ");
        }
        return str;
    }

    this.leftPad = function (str, stepName) {
        if (this.stepIndent > stepName.length) {
            var from = str.indexOf(stepName);
            var rem = str.substr(from, str.length - from);
            var step;

            if(stepName === activeWords.scenario) {
                step = Array(this.stepIndent - stepName.length).join(" ") + rem
                
            } else if (stepName === activeWords.background) {
                step = this.leftPadAmount(rem, this.stepIndent - stepName.length + 2);
                
            } else if (stepName === activeWords.examples) {
                step = this.leftPadAmount(rem, this.stepIndent - stepName.length + 4);
                
            } else {
                step = this.leftPadAmount(rem, this.stepIndent - stepName.length + 1);
            }
            return step;
        }
        return str;
    }

    this.leftPadAmount = function (str, distance) {
        if(distance > 0) {
            str = Array(distance).join(" ") + str;
        }
        return str;
    }

}

module.exports = Indent;