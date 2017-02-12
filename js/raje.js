/*
 *
 * rash-inline.js - Version 0.0.1
 * Copyright (c) 2016, Gianmarco Spinaci <spino9330@gmail.com>
 *
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
 * IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 */

var rash_inline_selector = '#rashEditor',
  section_abstract_selector = 'section[role=\"doc-abstract\"]',
  section_bibliography_selector = 'section[role=\"doc-bibliography\"]',
  section_acknowledgement_selector = 'section[role=\"doc-acknowledgements\"]',
  section_footnotes_selector = 'section[role=\"doc_footnotes\"]';

var meta_headers_selector = 'h1.title, strong.author_name, code.email, span.affiliation, p.keywords>ul.list-inline, p.acm_subject_categories>code';

window['bodyContent'] = ''
edit_state = false

// If there isn't any githubToken, editable starts with true to change and hide navbar
editable = false
window['settings'] = {}

jQuery.fn.extend({
  setEditable: function () {
    $(this).attr('contenteditable', true);
    $('span.editgen').show();
    $('#editNavar').show();

    //Remove href
    $('header.page-header code.email>a').each(function () {
      $(this).removeAttr('href')
    })

    $('footer.footer').hide()

    /** hide endnote back button */
    $('section[role="doc-endnote"]').each(function () {
      $(this).find('sup.cgen').hide()
    })

    /** 
     * Check if body has been modified yet 
     * If current body and saved body are equal, edit_state is false (not modified)
     * otherwise edit_state is true
     */
    $(this).on('input', function () {
      edit_state = $(rash_inline_selector).html() != bodyContent
      setEditState()
    })
  },
  setNotEditable: function () {
    $(this).attr('contenteditable', false);
    $('span.editgen').hide();
    $('#editNavar').hide();

    //Reset attr
    $('header.page-header code.email>a').each(function () {
      $(this).attr('href', 'mailto:' + $(this).text())
    })

    $('footer.footer').show()

    /** show endnote back button */
    $('section[role="doc-endnote"]').each(function () {
      $(this).find('sup.cgen').show()
    })
  },

  getNextFormulaID: function () {
    let id = 0
    $(formulabox_selector_rendered).each(function () {
      id = Math.max(id, parseInt($(this).attr('id').replace('formula_')))
    })
    return ++id
  },

  removeElement: function () {
    var toDeleteSpan = $(this);
    toDeleteSpan.replaceWith(toDeleteSpan.get(0).innerHTML);
  },

  appendChildren: function (number, childrenType) {
    while (number-- > 0) {
      $(this).append($(childrenType));
    }
  },
  hasAbstract: function () {
    return $(this).has('section[role=\"doc-abstract\"]').length;
  },
  hasAcknowledgments: function () {
    return $(this).has('section[role=\"doc-acknowledgements\"]').length;
  },
  hasBibliography: function () {
    return $(this).has('section[role=\"doc-bibliography\"]').length;
  },
  hasEndnotes: function () {
    return $(this).has('section[role=\"doc-endnotes\"]').length;
  },
  trimChar: function () {
    $(this).contents().filter(function () {
      return this.nodeType === 3 && $.trim(this.nodeValue).length;
    }).replaceWith('');
  },
  sanitizeText: function () {
    console.log($(this).html());
    $(this).html().replace(ZERO_SPACE, '');
    console.log($(this).html());
  }
});

window.handleInline = function (type) {
  window[type] = new rashEditor.inline(type);
  window[type].add();
  return false;
};

window.handleExternalLink = function () {
  window['externalLink'] = new rashEditor.externalLink();
  window['externalLink'].showModal();
};

window.handleCrossRef = function () {
  window['crossReference'] = new rashEditor.crossRef();
  window['crossReference'].showModal();
};

window.handleTableBox = function () {
  var id = 'table_' + ($(this).findNumber(tablebox_selector) + 1);
  window[id] = new rashEditor.Table(id);
  window[id].add();
};

window.handleFigureBox = function () {
  var id = 'figure_' + ($(this).findNumber(figurebox_selector) + 1);
  window[id] = new rashEditor.Figure(id)
  window[id].showModal();
}

window.handleFormulaBox = function () {
  var id = 'formula_' + $(rash_inline_selector).getNextFormulaID()
  window[id] = new rashEditor.Formula(id);
  window[id].showModal();
};

$(document).ready(function () {

  /* START .rash_inline */
  var inline = $('<div id=\"rashEditor\" class=\"cgen editgen container\"></div>');

  inline.insertAfter('header.page-header.cgen');

  $('body > section').each(function () {
    $(this).detach();
    $(this).appendTo(inline);
  });
  /* END .rash_inline */

  if (checkSoftware()) {
    showNavbar();

    $(rash_inline_selector).setEditable()

    $(rash_inline_selector).addClass('mousetrap');
    $(rash_inline_selector).on('focus', function (event) {
      updateDropdown();
    });

    $('[data-toggle="tooltip"]').tooltip({
      placement: 'bottom',
      container: 'body'
    });

    rashEditor.init();

    //sortableAuthors()
    //EDITABLE meta
    attachHeaderEventHandler()

    if (settings) {
      $('#mode>button').prepend(`<img class="avatar" src="${settings.avatar}" alt="Github profile picture"/>`)

      $('#mode>ul.dropdown-menu').html(`
      <li class="disabled"><a>Signed as <b>${settings.login}</b></a></li>
      <li role="separator" class="divider"></li>
      <li><a onclick="addCommitModal()">Push</a></li>
      <li role="separator" class="divider"></li>
      <!-- todo -->
      <li><a onclick="">Logout</a></li>
    `)
    }

    bodyContent = $(rash_inline_selector).html()
  }
})

function attachHeaderEventHandler() {

  $(meta_headers_selector).on('dblclick', function () {
    if (checkLogin()) {
      $(this).attr('contenteditable', 'true')
      $(this).addClass('mousetrap')
    }
  })

  $(meta_headers_selector).on('focusout', function () {
    if (checkLogin()) {
      $(this).attr('contenteditable', 'false')
      $(this).addClass('mousetrap')
    }
  })
}

function updateEditState() {

  bodyContent = $(rash_inline_selector).html()
  edit_state = false

  //send edit state to main process
  setEditState()
}
caret = {

  moveAfterNode: function (node) {
    var selection = window.getSelection(),
      range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  },

  checkIfInEditor: function () {
    return $(window.getSelection().anchorNode).parents(rash_inline_selector).length;
  },

  checkIfInHeader: function () {
    return $(window.getSelection().anchorNode).parents('header.page-header').length;
  },

  checkIfBorder: function () {
    var sel = rangy.getSelection(),
      node = sel.anchorNode;
    if (node.nodeType === 3) {
      if (sel.isCollapsed) {
        if (sel.anchorOffset == 0)
          return -1;
        else if (sel.anchorOffset == node.length)
          return 1;
      } else {
        var left = sel.isBackwards() ? sel.focusOffset : sel.anchorOffset;
        var right = sel.isBackwards() ? sel.anchorOffset : sel.focusOffset;

        if (left == 0 && right == node.length)
          return 0
        else if (left == 0)
          return -1;
        else if (right == node.length)
          return 1;
      }
    }
  },

  appendOrPrependZeroSpace: function () {
    var sel = rangy.getSelection(),
      element = $(sel.anchorNode.parentElement),
      border = caret.checkIfBorder();
    if (border == -1)
      element.prepend(ZERO_SPACE);
    else if (border == 1)
      element.append(ZERO_SPACE);
  },

  sanitizeElement: function (sel) {
    var element = $(sel.anchorNode).parentsUntil('section').last();
    element.sanitizeText();
  },

  /**
   * [selectNode description]
   * @method selectNode
   * @param  {[type]}   node [description]
   * @return {[type]}        [description]
   */
  selectNode: function (node) {

    var range = rangy.createRange();
    range.selectNode(node[0]);

    var sel = rangy.getSelection();

    sel.refresh();
    sel.addRange(range);
  },
  /**
   * Move selection to startOffset of current node
   * @method moveToStart
   * @param  {Object} node
   */
  moveStart: function (node) {

    var range = rangy.createRange();
    range.setStart(node[0], 0);

    var sel = rangy.getSelection();
    sel.refresh();
    sel.removeAllRanges();
    sel.addRange(range);
  },

  moveEnd: function (node) {

    var range = rangy.createRange();
    range.setStart(node[0], node[0].innerHTML.length);

    var sel = rangy.getSelection();
    sel.refresh();
    sel.removeAllRanges();
    sel.addRange(range);
  },

  moveWindow: function (node) {

    if (node.parents('section').last().next().is('footer'))
      window.scrollTo(-100, document.body.scrollHeight);
  },

  moveTo: function (node, focus) {

    rangy.getSelection().collapse(node, focus);
  }
};

const INLINE = {
  CODE: 'code',
  QUOTE: 'q',
};

const TABLE = {
  DATA: '<td><p><br/></p></td>',
  HEAD: '<th>heading</th>'
};

const TAB = '  '

const ZERO_SPACE = '&#8203;';
const ONE_SPACE = '&nbsp;';

rashEditor = {

  /* und/redo */

  undo: function () {
    document.execCommand("undo");
    //TODO manage footer
  },

  redo: function () {
    document.execCommand("redo");
    //TODO manage footer
  },
  /* END undo/redo */

  /* inlines */

  insertParagraph: function (node) {
    $(node).after(ZERO_SPACE);
    caret.moveAfterNode(node);
    document.execCommand("insertHTML", false, '<p><br/></p>');
    $(node).parentsUntil(rash_inline_selector).last().trimChar();
  },

  insertCodeBlock: function () {
    document.execCommand("insertHTML", false, '<pre><code><br/></code></pre>');
  },

  insertUnorderedList: function () {
    document.execCommand("insertUnorderedList");
  },

  insertOrderedList: function () {
    document.execCommand("insertOrderedList");
  },

  insertQuoteBlock: function () {
    document.execCommand("insertHTML", false, '<blockquote><p><br/></p></blockquote>');
  },

  insertBold: function () {
    document.execCommand("bold");
    //TODO manage semantic revision
  },

  insertItalic: function () {
    document.execCommand("italic");
    //TODO manage semantic revision
  },

  externalLink: function () {

    this.selection

    var sel = rangy.getSelection()
    if (sel.rangeCount) {
      this.selection = rangy.saveSelection()
    }

    this.showModal = function () {

      addExternalLinkModal()
    }

    this.addLink = function (link, title) {
      if (undefined !== this.selection) {

        rangy.restoreSelection(this.selection);
        document.execCommand('createLink', false, link);
      }
    }
  },

  header: {

    insertKeyword: function () {

      var sel = rangy.getSelection();
      if (sel.rangeCount && sel.isCollapsed && caret.checkIfInHeader()) {

        let selectedKeyword = $(sel.anchorNode).parentsUntil('ul.list-inline').last()

        selectedKeyword.after(ONE_SPACE);
        caret.moveAfterNode(selectedKeyword[0]);

        document.execCommand("insertHTML", false, `<li><code>${ZERO_SPACE}</code></li>`);
      }
    },
    insertSubject: function () {

      var sel = rangy.getSelection();
      if (sel.rangeCount && sel.isCollapsed && caret.checkIfInHeader()) {

        let selectedKeyword = $(sel.anchorNode).parentsUntil('p.acm_subject_categories').last(),
          newElement = $(`<br/><code>Placeholder subject</code>`)

        selectedKeyword.after(newElement)

        attachHeaderEventHandler()
      }
    },
    addAffiliation: function () {

      var sel = rangy.getSelection();
      if (sel.rangeCount && sel.isCollapsed && caret.checkIfInHeader()) {

        let selectedKeyword = $(sel.anchorNode).parentsUntil('address.lead.authors').last(),
          newElement = $(`<br/><span class="affiliation">Placeholder affiliation</span>`)

        selectedKeyword.after(newElement)

        attachHeaderEventHandler()
      }
    },
    insertSubTitle: function () {
      var sel = rangy.getSelection()
      if (sel.rangeCount && sel.isCollapsed && caret.checkIfInHeader()) {

        let title = $(sel.anchorNode).parents('h1')

        if (!title.find('small').length)
          document.execCommand("insertHTML", false, `<br/><small>${ZERO_SPACE}</small>`)
      }
    },

    insertPlaceholderAuthor: function () {

      let lastAuthor = $('address.lead.authors:last()')
      let placeholderAuthor = $(`
        <address class="lead authors">
          <strong class="author_name">Author name</strong>
          <code class="email"><a>author@email.com</a></code><br>
          <span class="affiliation">Author Affiliation</span>
        </address>`)

      placeholderAuthor.insertAfter(lastAuthor)

      attachHeaderEventHandler()
    },

    setRemoveAuthors: function () {

      $('address.lead.authors').each(function () {

        $(this).prepend(`<span class="btnRemove"><i class="fa fa-times" aria-hidden="true"></i></span>`)

        $('span.btnRemove').on('click', function () {

          $(this).parent('address').remove()
        })
      })
    },

    unsetRemoveAuthors: function () {
      $('address.lead.authors').each(function () {
        $(this).find('span.btnRemove').remove()
      })
    },

    setReorganizeAuthors: function () {

      let sortable = $(`<ul id="sortable"> </ul>`)

      $('address.lead.authors').each(function () {

        $(this).detach()
        let listElement = $('<li class="ui-state-default"></li>')

        listElement.html($(this)[0].outerHTML)

        sortable.append(listElement)
      })

      sortable.insertAfter($('h1.title'))

      $("#sortable").sortable({ revert: true });
    },

    unsetReorganizeAuthors: function () {

      $('li.ui-state-default').each(function () {

        if (!$('header').children('address.lead.authors').length)
          $(this).find('address.lead.authors').insertAfter($('h1.title'))

        else
          $(this).find('address.lead.authors').insertAfter($('header > address.lead.authors').last())
      })

      attachHeaderEventHandler()
      $("#sortable").remove()
    }
  },

  crossRef: function () {

    this.selection

    var sel = rangy.getSelection()
    if (sel.rangeCount) {
      this.selection = rangy.saveSelection()
    }

    this.showModal = function () {
      addCrossRefModal()
    }

    this.add = function (ref) {
      if (undefined !== this.selection) {

        rangy.restoreSelection(this.selection);

        document.execCommand('insertHTML', false, `<a href="#${ref}">${ONE_SPACE}</a>`)
        references()

        /** remove back button on footnotes */
        $(`section[role="doc-endnote"]`).each(function () {
          $(this).find('sup.hidden-print.cgen').remove()
        })
      }
    }

    this.addBiblioentry = function (id) {
      this.add(`bib${id}`)
    }

    this.addEndnote = function (id) {
      this.add(`fn${id}`)
    }

    this.getAllReferenceables = function () {
      let referenceables = ''

      /** retrieve sections */
      let sections = $('<div class="list-group">')
      $(rash_inline_selector + '>section[role]').each(function () {
        sections.append(`<a data-type="role" data-ref="${$(this).attr('role')}" class="list-group-item">${$(this).find('h1:first-child').text()}</a>`)
      })
      $(rash_inline_selector + '>section:not([role])').each(function () {
        sections.append(`<a data-type="section" data-ref="${$(this).attr('id')}" class="list-group-item">${$(this).find('h1:first-child').text()}</a>`)
      })
      referenceables += '<p><b>Sections</b></p>' + sections[0].outerHTML

      /** retrieve blocks */
      let blocks = $('<div class="list-group">')
      $(rash_inline_selector + '>section figure').each(function () {

        let text = $(this).find('strong:first()').length ? $(this).find('strong:first()').text() : ` Formula ${$(this).find('span.cgen').text()}`
        blocks.append(`<a data-type="box" data-ref="${$(this).attr('id')}" class="list-group-item">${text}</a>`)
      })
      referenceables += '<p><b>blocks</b></p>' + blocks[0].outerHTML

      /** retrieve bibliography */
      let biblio = $('<div class="list-group">')
      $(rash_inline_selector + '>section[role="doc-bibliography"] li').each(function () {
        biblio.append(`<a data-type="biblioentry" data-ref="${$(this).attr('id')}" class="list-group-item">${$(this).find('p').text()}</a>`)
      })
      biblio.append(`<a data-type="addBiblioentry" class="list-group-item">+ add new biblioentry</a>`)
      referenceables += '<p><b>Biblioentry</b></p>' + biblio[0].outerHTML

      /** retrieve endnotes */
      let endnotes = $('<div class="list-group">')
      $(rash_inline_selector + '>section[role="doc-endnotes"] section').each(function () {
        endnotes.append(`<a data-type="endnote" data-ref="${$(this).attr('id')}" class="list-group-item">${$(this).find('p').text()}</a>`)
      })
      endnotes.append(`<a data-type="addEndnote" class="list-group-item">+ add new footnote</a>`)
      referenceables += '<p><b>Footnotes</b></p>' + endnotes[0].outerHTML

      return referenceables
    }
  },

  insertInline: function (element) {
    var sel = rangy.getSelection();
    if (sel.rangeCount && !sel.isCollapsed && caret.checkIfInEditor()) {
      var range = sel.getRangeAt(0);
      var text = range.toString();
      /*
        Check if selection is at the parentElement start or end
        In this case add ZERO_SPACE ascii_code to allow normal contenteditable behaviour
      */
      caret.appendOrPrependZeroSpace();
      document.execCommand("insertHTML", false, '<' + element + '>' + text + '</' + element + '>');
      caret.sanitizeElement(sel);
    }
  },

  insertInlineFormula: function () {
    var sel = rangy.getSelection();
    if (sel.rangeCount && sel.isCollapsed && caret.checkIfInEditor()) {
      /*
        Check if selection is at the parentElement start or end
        In this case add ZERO_SPACE ascii_code to allow normal contenteditable behaviour
      */
      caret.appendOrPrependZeroSpace();
      document.execCommand("insertHTML", false, '<span class=\"inline_formula\"> formula </span>');
      caret.sanitizeElement(sel);
    }
  },

  renderInlineFormula: function () {
    var node = $('.inline_formula');
    caret.selectNode(node);
    var range = rangy.getSelection().getRangeAt(0);

    var text = range.toString();
    document.execCommand('delete');
    document.execCommand('insertHTML', false, '`' + text + '`');
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  },

  exitInline: function (node) {
    node.after(ZERO_SPACE);
    caret.moveAfterNode(node[0]);
    rangy.getSelection().move('character', 1);
    document.execCommand('insertText', false, ' ');
  },

  /* END inlines */

  /* cross-ref */

  insertCrossRef: function () {
    var reference = prompt('Select reference', 'abstract');
    if (reference !== null) {
      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        document.execCommand("insertHTML", false, '<a href=\"' + reference + '\"> </a>');
      else {
        //With webkit editor needs to override link text with blank space
        document.execCommand("createLink", false, reference);
        document.execCommand("insertHTML", false, ONE_SPACE);
      }
      createReference();
    }
  },

  getCrossRefList: function () {

    var references = [];

    //TODO get sections reference
    $('section').each(function () {
      references.push(
        $(this).attr('role') ?
          'section[' + $(this).attr('role') + ']' :
          'section#' + $(this).attr('id')
      );
    });

    //TODO get figures references
    $('figure').each(function (index) {

    });

    console.log(references);
  },

  /* END cross-res */

  insertSuperscript: function () {
    document.execCommand("superscript");
  },

  insertSubscript: function () {
    document.execCommand("subscript");
  },

  /* sections */

  insertMainSection: function () {
    if (typeof savedSelection != "undefined" && !savedSelection.restored) rangy.restoreSelection(savedSelection);

    if (typeof rangy.getSelection() != "undefined" && caret.checkIfInEditor()) {
      var node = $(rangy.getSelection().anchorNode).parentsUntil(rash_inline_selector).last();
      node.after(ZERO_SPACE);
      caret.moveAfterNode(node[0]);
      document.execCommand("insertHTML", false, '<section><h1><br/></h1></section>');
      containerSection();
      $(rash_inline_selector).trimChar();
    }
  },

  getLastSectionId: function (ids) {

    let max = -1
    ids.forEach(function (id) {
      let integerId = parseInt(id.replace('section', ''))
      if (integerId > max) max = integerId
    })
    return max + 1
  },

  insertSection: function (level, isShortcut) {
    // Restore selection if isn't restored yet and check if the selection exists and is inside the editor
    if (typeof savedSelection != "undefined" && !savedSelection.restored) rangy.restoreSelection(savedSelection);
    if (typeof rangy.getSelection() != "undefined" && caret.checkIfInEditor()) {

      // Get all section parent of selected node, inside the editor
      var sections = $(rangy.getSelection().anchorNode).parentsUntil(rash_inline_selector, 'section'),
        text = $(rangy.getSelection().anchorNode).parent(), id = []

      $(rash_inline_selector + ' section:not([role])').each(function () {
        id.push($(this).attr('id'))
      })

      // If user doesn't wanna insert an element right above the caret
      if (level <= sections.length) {
        // Moving caret after node where is needed to be insert new section
        var selectedSection = $(sections.get(sections.length - level));
        selectedSection.after(ZERO_SPACE);
        caret.moveAfterNode(selectedSection[0]);
      }

      id = !id.length ? 1 : this.getLastSectionId(id)

      // Insert new section
      document.execCommand("insertHTML", false, '<section class="pointer" id="section' + id + '"><h1><br/></h1></section>');

      if (isShortcut) {
        caret.selectNode(text);
        text[0].parentNode.removeChild(text[0]);
      }

      // Rendering RASH things
      //containerSection();
      heading_dimensions();

      // TODO please change!!1!
      caret.moveStart($('.pointer').find('h1,h2,h3,h4,h5,h6'));
      $('.pointer').removeClass('pointer');
    }
  },

  insertSubSection: function () {
    if (typeof savedSelection != "undefined" && !savedSelection.restored) rangy.restoreSelection(savedSelection);

    //right solution Chrome & Firefox
    if (typeof rangy.getSelection() != "undefined" && caret.checkIfInEditor()) {
      var selection = window.getSelection();
      var node = selection.anchorNode;
      if ($(node).is('h1,h2,h3,h4,h5')) {
        $(node).after(ZERO_SPACE);
        caret.moveAfterNode(node);
      }
      document.execCommand("insertHTML", false, '<section><h1><br/></h1></section>');
      headingDimension();
    }
  },

  insertAcknowledgementSection: function () {
    if (!$(rash_inline_selector).hasAcknowledgments()) {
      var ack = `
        <section role=\"doc-acknowledgements\">
          <h1>Acknowledgements</h1>
          <p><br/></p>
        </section>`;
      var sections = $(rash_inline_selector + '>section:not([role])');
      if (sections.last().length) {
        sections.last().after(ZERO_SPACE);
        caret.moveAfterNode(sections.last()[0]);
      } else if ($(rash_inline_selector).hasAbstract()) {
        $(section_abstract_selector).after(ZERO_SPACE);
        caret.moveAfterNode($(section_abstract_selector)[0]);
      }
      document.execCommand("insertHTML", false, ack);
      $(rash_inline_selector).trimChar();
    } else {
      caret.moveStart($(section_acknowledgement_selector + ' > h1'));
    }
  },

  /**
   * Insert bibliography section is not exists
   * OR
   * Insert a biblioentry after the selected entry
   */
  insertBibliography: function (node) {

    let inserted = 1

    /** is does not exists create */
    if (!$(rash_inline_selector).hasBibliography()) {
      var biblio = `
        <section id=\"bibreflist\" role=\"doc-bibliography\">
          <h1>References</h1>
          <ol>
            <li id=\"bib1\" role=\"doc-biblioentry\"><p><br/></p></li>
          </ol>
        </section>`
      var node

      /** Retrieve position to section */
      if ($(rash_inline_selector).hasAcknowledgments())
        node = $(section_acknowledgement_selector)

      else if ($(rash_inline_selector + '>section:not([role])').length)
        node = $(rash_inline_selector + '>section:not([role])').last()

      else
        node = $(section_abstract_selector)

      /** insert after node */
      node.after(ZERO_SPACE)
      caret.moveAfterNode(node[0])
      document.execCommand("insertHTML", false, biblio)

      /** If section already exists, add a new entry */
    } else {

      if (!node)
        node = $('section[role="doc-bibliography"] li:last-child')

      let getNextBibliography = function () {
        let max = -1
        node.parent('ol').find('li').each(function () {
          let currentCnt = parseInt($(this).attr('id').replace('bib', ''))
          max = max > currentCnt ? max : currentCnt
        })
        return max
      }

      inserted = getNextBibliography() + 1

      node.after(ZERO_SPACE)
      caret.moveAfterNode(node[0])
      document.execCommand("insertHTML", false, `<li id="bib${inserted}" role="doc-biblioentry"><p><br/></p></li>`)

    }
    $(rash_inline_selector).trimChar()

    return inserted
  },

  insertEndnote: function (node) {

    let inserted = 1

    if (!$(rash_inline_selector).hasEndnotes()) {
      var endnotes = `
        <section id="fnlist" role="doc-endnotes">
          <h1>Footnotes</h1>
          <section id="fn1" role="doc-endnote">
            <p>
              <br/>
            </p>
          </section>
        <section>`

      let node

      // must check after which elem
      if ($(rash_inline_selector).hasBibliography())
        node = $(section_bibliography_selector)

      else if ($(rash_inline_selector).hasAcknowledgments())
        node = $(section_acknowledgement_selector)

      else if ($(rash_inline_selector + '>section:not([role])').length)
        node = $(rash_inline_selector + '>section:not([role])').last()

      else
        node = $(section_abstract_selector)

      // insert entire section with first element
      node.after(ZERO_SPACE)
      caret.moveAfterNode(node[0])
      document.execCommand("insertHTML", false, endnotes)
      $(rash_inline_selector).trimChar()

    } else {

      if (!node)
        node = $('section[role="doc-endnotes"]>section:last-child')

      let getNextEndnote = function () {
        let max = -1
        node.parent('section[role="doc-endnotes"]').find('section').each(function () {
          let currentCnt = parseInt($(this).attr('id').replace('fn', ''))
          max = max > currentCnt ? max : currentCnt
        })
        return max
      }

      inserted = getNextEndnote() + 1

      node.after(ZERO_SPACE);
      caret.moveAfterNode(node[0]);
      document.execCommand("insertHTML", false, `<section id="fn${inserted}" role="doc-endnote"><p><br/></p></section>`)
    }

    return inserted
  },

  /* END sections  */

  /* boxes */

  /**
   * Extends normal table behaviour and allows customization
   * @method table
   * @param  {String} id Unique identifier of a table (as table_1, table_2)
   */
  Table: function (id) {

    this.figure = `
        <figure id=\"${id}\">
          ${tableOptions}
          <table>
            <tr> ${TABLE.HEAD} ${TABLE.HEAD} </tr>
            <tr> ${TABLE.DATA} ${TABLE.DATA} </tr>
            <tr> ${TABLE.DATA} ${TABLE.DATA} </tr>
          </table>
          <figcaption> Caption of the <code>table</code>. </figcaption>
        </figure>`;
    this.figcaption = $();
    this.rows = 2;
    this.cols = 2;
    this.head = {
      top: true,
      left: false
    };
    this.id = 'figure#' + id + '>table';

    /**
     * Method used to add table to document where caret is placed
     * New table is 2x2 with top heading
     * @method add
     */
    this.add = function () {

      document.execCommand("insertHTML", false, this.figure);

      //TODO modify this
      addTableSettingsModal();
      //footer();
    };
    /* Getters */
    this.hasTopHeading = function () {
      return this.head.top;
    };
    this.hasLeftHeading = function () {
      return this.head.left;
    };
    this.getRows = function () {
      return this.rows;
    };
    this.getCols = function () {
      return this.cols;
    };

    /**
     * Add or delete rows from table
     * @method AddDelRows
     * @param  {Int}   n amount of rows (to delete if negative)
     */
    this.addDelRows = function (n) {
      //Add
      if (n > 0) {
        var tmp = n;
        while (tmp-- > 0) {
          var row = $('<tr></tr>');
          if (this.head.left)
            row.append(TABLE.HEAD);
          row.appendChildren(this.cols, TABLE.DATA);
          $(this.id).append(row);
        }
      }
      //Delete
      else {
        var diff = this.rows + n;
        if (diff > 0)
          $(this.id).find('tr:not(:has(th:last-child))').slice(diff).remove();
      }
      this.rows += n;
    };

    /**
     * Add or delete columns
     * @method addCols
     * @param  {Int} n  amount of columns (to delete if negative)
     */
    this.addDelCols = function (n) {
      //Add
      if (n > 0) {
        for (var i = 1; i <= this.rows + 1; i++) {
          if (this.head.top && i === 1)
            $(this.id).find('tr:first-child').appendChildren(n, TABLE.HEAD);
          else
            $(this.id).find('tr:nth-child(' + i + ')').appendChildren(n, TABLE.DATA);
        }
      }
      //Delete
      else {
        var diff = this.cols + n - 1;
        if (diff > 0) {
          if (this.head.left)
            $(this.id).find('tr').find('td:gt(' + (diff++) + '), th:gt(' + (diff) + ')').remove();
          else
            $(this.id).find('tr').find('td:gt(' + (diff) + '), th:gt(' + (diff) + ')').remove();
        }
      }
      this.cols += n;
    };

    /* Methods to toggle headings */
    this.toggleLeftHead = function () {
      this.head.left = !this.head.left;
      if (this.head.left) {
        $(this.id).find('tr').prepend(TABLE.HEAD);
      } else {
        $(this.id).find('tr > th:first-child').remove();
      }
    };
    this.toggleTopHead = function () {
      this.head.top = !this.head.top;
      if (this.head.top) {
        var row = $('<tr></tr>');
        var nCols = this.cols + (this.head.left ? 1 : 0);
        row.appendChildren(nCols, TABLE.HEAD);
        $(this.id).prepend(row);
      } else {
        $(this.id).find('tr:first-child').remove();
      }
    };

    /**
     * Delete this table
     * @method delete
     */
    this.delete = function () {
      if (confirm('Are you sure you want to delete selected table?')) {
        $(this.id).parent().remove();
        table_captation();
        refresh_footer();
      }
    };
  },

  Figure: function (id) {

    this.selection;
    this.id = id;

    this.showModal = function () {
      var sel = rangy.getSelection();
      if (sel.rangeCount) {
        this.selection = rangy.saveSelection();

        selectImageFileModal(this.id)
      }
    }

    this.addFigure = function (name) {

      if (undefined !== this.selection) {

        let html = `
          <figure id="${this.id}">
            <p>
              <img src="img/${name}" alt="${name}"/>
              <figcaption>
                ${ZERO_SPACE}Caption of the <code>figure</code>.
              </figcaption>
            </p>
          </figure>`

        rangy.restoreSelection(this.selection)
        document.execCommand("insertHTML", false, removeWhiteSpaces(html))
      }
    }

    this.save = function (file) {

      sendWriteFigure(file)

      this.addFigure(file.name)
      captions()
    }

    this.saveFromUrl = function (url) {
      let filename = sendWriteFigureFromUrl(url)

      this.addFigure(filename)
      captions()
    }
  },

  Formula: function (id) {
    this.selection;
    this.id = id;

    this.showModal = function () {
      var sel = rangy.getSelection();
      if (sel.rangeCount) {
        this.selection = rangy.saveSelection();

        //addFormulaModal(this.id);
        addFormulaEditorModal(this.id)
      }
    };

    this.addBlock = function (asciiFormula) {
      this.asciiFormula = asciiFormula;
      if (undefined !== this.selection) {
        rangy.restoreSelection(this.selection);

        // render formula
        document.execCommand("insertHTML", false, "<figure id=\"" + this.id + "\"><p class=\"rash-math\">\`\`" + asciiFormula + "\`\`</p></figure>");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

        //get mathml 
        let mathml = $('figure#' + this.id).find('span[data-mathml]').data('mathml')
        $('figure#' + this.id).html(`<p>${mathml}</p>`)

        captions()
        formulas()
      }
    };
  }

  /* END boxes */
};

rashEditor.
  /**
   * [init description]
   * @method init
   * @return {[type]} [description]
   */
  init = function () {

    // paste only text, without style
    $(rash_inline_selector)[0].addEventListener("paste", function (e) {

      e.preventDefault();

      var text = e.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, text);
    });

    Mousetrap.bind('mod+s', function (event) {
      executeSave()
      return false
    });

    Mousetrap.bind('mod+shift+s', function (event) {
      addCommitModal()
      return false
    });

    Mousetrap.bind('space', function (event) {
      var sel = rangy.getSelection()

      if (typeof window.getSelection != "undefined" && (caret.checkIfInEditor() || caret.checkIfInHeader())) {
        var node = sel.anchorNode

        var parent = {
          reference: $(node).parents('a[href]:has(span.cgen),a[href]:has(sup.cgen)').last()
        }

        if (parent.reference.length) {
          rashEditor.exitInline(parent.reference)
          return false
        }

      }
    })

    Mousetrap.bind('enter', function (event) {
      var sel = rangy.getSelection();
      if (typeof window.getSelection != "undefined" && (caret.checkIfInEditor() || caret.checkIfInHeader())) {
        var node = sel.anchorNode;
        var parent = {

          //inlines
          crossRef: $(node).parents('a.cgen').last(),
          code_inline: $(node).parents('code').last(),
          quote_inline: $(node).parents('q').last(),
          formula_inline: $(node).parents('.inline_formula').last(),

          //blocks
          pre: $(node).parents('pre').last(),
          blockquote: $(node).parents('blockquote').last(),
          figure: $(node).parents('figure').last(),

          //header
          keywords: $(node).parents('p.keywords').last(),
          subjects: $(node).parents('p.acm_subject_categories').last(),
          title: $(node).parents('h1.title').last(),
          affiliation: $(node).parents('span.affiliation').last(),

          //bibliography
          bibliography: $(node).parents('section[role="doc-bibliography"]').last(),
          endnote: $(node).parents('section[role="doc-endnotes"]').last()
        };

        // inlines
        if (parent.crossRef.length) {
          rashEditor.exitInline(parent.crossRef);
          return false;

        } else if (parent.code_inline.length) {
          rashEditor.exitInline(parent.code_inline);
          return false;

        } else if (parent.quote_inline.length) {
          rashEditor.exitInline(parent.quote_inline);
          return false;

        } else if (parent.formula_inline.length) {
          rashEditor.renderInlineFormula();
          return false;

        }

        // blocks
        else if (parent.pre.length) {
          rashEditor.insertParagraph(parent.pre[0]);
          return false;

        } else if (parent.blockquote.length) {
          rashEditor.insertParagraph(parent.blockquote[0]);
          return false;

        } else if (parent.figure.length) {
          rashEditor.insertParagraph(parent.figure[0]);
          return false;

        }

        // header
        else if (parent.title.length) {
          rashEditor.header.insertSubTitle()
          return false

        } else if (parent.affiliation.length) {
          rashEditor.header.addAffiliation()
          return false

        } else if (parent.keywords.length) {
          rashEditor.header.insertKeyword()
          return false

        } else if (parent.subjects.length) {
          rashEditor.header.insertSubject()
          return false

        }

        /** bibliography */
        else if (parent.bibliography.length) {
          rashEditor.insertBibliography($(node).parents('li').last())
          return false

        }

        /** endnotes */
        else if (parent.endnote.length) {
          rashEditor.insertEndnote($(node).parents('section[role="doc-endnote"]').last())
          return false
        }
      }
      return true;
    });

    var alphabet = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
      'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z', 'space', ',',
      'shift+a', 'shift+b', 'shift+c', 'shift+d', 'shift+e', 'shift+f', 'shift+g',
      'shift+h', 'shift+i', 'shift+j', 'shift+k', 'shift+l', 'shift+m', 'shift+n',
      'shift+o', 'shift+p', 'shift+q', 'shift+r', 'shift+s', 'shift+t', 'shift+u',
      'shift+v', 'shift+w', 'shift+y', 'shift+z'
    ];


    //Map section and ordered list
    var sections = [
      '# # # # # # enter',
      '# # # # # enter',
      '# # # # enter',
      '# # # enter',
      '# # enter',
      '# enter'
    ];

    var orderedListMaps = [
      '1 . enter',
      '2 . enter',
      '3 . enter',
      '4 . enter',
      '5 . enter',
      '6 . enter',
      '7 . enter',
      '8 . enter',
      '9 . enter'
    ];

    // New sections can be added only in a new line
    Mousetrap.bind(sections, function (event, sequence) {
      sequence = sequence.replace('enter', '').replace(/\s/g, ''),
        node = rangy.getSelection().anchorNode;

      // Check if is possible to add new section with shortcuts
      if (node.nodeType == 3 && node.textContent == sequence) {
        rashEditor.insertSection(sequence.length, true);
        return false;
      }

    });

    Mousetrap.bind('* enter', function (event) {
      rashEditor.insertUnorderedList()
      return false;
    });

    Mousetrap.bind(orderedListMaps, function (event) {
      rashEditor.insertOrderedList()
      return false;
    });

    Mousetrap.bind('mod+shift+f', function (event) {
      rashEditor.insertInlineFormula();
      return false;
    });

    Mousetrap.bind('| enter', function (event) {
      rashEditor.insertQuoteBlock()
      return false;
    });

    Mousetrap.bind('mod+b', function (event) {
      rashEditor.insertBold();
      return false;
    });

    Mousetrap.bind('mod+i', function (event) {
      rashEditor.insertItalic();
      return false;
    });
  };
/** Edit navbar */
function showNavbar() {


  var editNavbar = $(`
      <nav id=\"editNavar\" class=\"navbar navbar-default navbar-fixed-top cgen editgen\">
        <div class=\"container\">
          <div class=\"row\">
            <div class=\"btn-group\" role=\"group\" aria-label=\"Inline elements\">

              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
              onclick=\"rashEditor.undo()\" title=\"Undo\" aria-pressed=\"false\">
                <i class=\"fa fa-undo\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onclick=\"rashEditor.redo()\" title=\"Redo\" aria-pressed=\"false\">
                <i class=\"fa fa-repeat\" aria-hidden=\"true\"></i>
              </button>

              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"rashEditor.insertBold()\" title=\"Strong\" aria-pressed=\"false\">
                <i class=\"fa fa-bold\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"rashEditor.insertItalic()\" title=\"Emphasis\">
                <i class=\"fa fa-italic\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"rashEditor.insertInline(INLINE.CODE)\" title=\"Code\">
                <i class=\"fa fa-code\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"handleExternalLink()\" title=\"External link\">
                <i class=\"fa fa-link\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"handleCrossRef()\" title=\"Cross-ref\">
                <i class=\"fa fa-anchor\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"rashEditor.insertInline(INLINE.QUOTE)\" title=\"Quote\">
                <i class=\"fa fa-quote-right\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"rashEditor.insertSuperscript()\" title=\"Sup\">
                <i class=\"fa fa-superscript\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"rashEditor.insertSubscript()\" title=\"Sub\">
                <i class=\"fa fa-subscript\" aria-hidden=\"true\"></i>
              </button>
            </div>

            <div class=\"btn-group\" role=\"group\" aria-label=\"Textual elements\">
            <!--
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onclick=\"rashEditor.insertParagraph()\" title=\"Paragraph\" aria-pressed=\"false\">
                <i class=\"fa fa-paragraph\" aria-hidden=\"true\"></i>
              </button>
              -->
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onclick=\"rashEditor.insertCodeBlock()\" title=\"Code block\" aria-pressed=\"false\">
                <i class=\"fa fa-code\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
              onclick=\"rashEditor.insertQuoteBlock()\" title=\"Block quote\">
                <i class=\"fa fa-quote-left\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
              onclick=\"rashEditor.insertOrderedList()\" title=\"Orderer list\">
                <i class=\"fa fa-list-ol\" aria-hidden=\"true\"></i>
              </button>
              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onclick=\"rashEditor.insertUnorderedList()\" title=\"Unordered list\">
                <i class=\"fa fa-list-ul\" aria-hidden=\"true\"></i>
              </button>
            </div>

            <div class=\"btn-group\" role=\"group\" aria-label=\"Box elements\">

              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"handleTableBox()\" title=\"Table\">
                <i class=\"fa fa-table\" aria-hidden=\"true\"></i>
              </button>

              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\" 
                onClick=\"handleFigureBox()\" title=\"Figure\">
                <i class=\"fa fa-picture-o\" aria-hidden=\"true\"></i>
              </button>

              <button type=\"button\" class=\"btn btn-default navbar-btn\" data-toggle=\"tooltip\"
                onClick=\"handleFormulaBox();\" title=\"Formula\">
                <i class=\"fa\">&radic;</i>
              </button>
            </div>

            <div class=\"btn-group\" role=\"group\" aria-label=\"Sections\" id=\"sectionDropdown\">

              <button class=\"btn btn-default navbar-btn\" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Sections
                <span class="caret"></span>
              </button>
              <ul class=\"dropdown-menu\" aria-labelledby=\"sectionDropdown\">
                <li onclick=\"rashEditor.section.addAbstract()\" id=\"addAbstract\"><a>Abstract</a></li>
                <li onclick=\"rashEditor.insertAcknowledgementSection()\" id=\"addAbstract\"><a>Acknowledgement</a></li>
                <li onclick=\"rashEditor.insertBibliographySection()\" id=\"addBibliography\"><a>Bibliography</a></li>
                <li role=\"separator\" class=\"divider\"></li>
              </ul>
            </div>
            
          </div>
        </div>
      </nav>`
  )

  var modeButton = $(`
      <div id=\"mode\" class="dropdown">
        <button type="button" data-toggle="dropdown" class=\"btn btn-default navbar-btn\"><i class="fa fa-bars" aria-hidden="true"></i></button>
        <ul class="dropdown-menu" aria-labelledby="dLabel">
          <li><a onclick="githubLogin()">Login w/ Github</a></li>
        </ul>
      </div>`
  )

  // add navbar and button
  $('body').prepend(editNavbar);
  $('body').prepend(modeButton);

  $('#sectionDropdown').on('show.bs.dropdown', function (event) {
    savedSelection = rangy.saveSelection();
  });

  $('#sectionDropdown').on('hide.bs.dropdown', function (event) {
    rangy.restoreSelection(savedSelection);
  });

  updateDropdown();
}

function updateDropdown() {
  if (typeof window.getSelection != "undefined" && caret.checkIfInEditor()) {
    var dropdown = $('.dropdown-menu'),
      sel = rangy.getSelection();

    dropdown.find('li:gt(3)').remove();
    var nodeList = $(rangy.getSelection().anchorNode).parentsUntil(rash_inline_selector, "section"),
      mainSection = '<li onclick=\"rashEditor.insertMainSection()\"><a>Main section</a></li>',
      subSection = '<li onclick=\"rashEditor.insertSubSection()\"><a>Sub section</a></li>';

    if (nodeList.last().attr('role') == 'doc-abstract' || !nodeList.last().attr('role'))
      dropdown.append(mainSection);

    if (!nodeList.last().attr('role') && nodeList.length <= 5)
      dropdown.append(subSection);
  }
}
/** End editNavar */

function addTableModal() {

  $("#customizeTableModal").remove();
  $("body").append($(`
    <div id=\"customizeTableModal\" class=\"modal fade cgen editgen\" tabindex=\"-1\" role=\"dialog\" contenteditable=\"false\">
      <div class=\"modal-dialog modal-sm\" role=\"document\">
        <div class=\"modal-content\">

          <div class=\"modal-header\">
            <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">
              <span aria-hidden=\"true\">&times;</span>
            </button>
            <h4>Customize table</h4>
          </div>

          <div class=\"modal-body\">
            <form>
              <div class=\"form-group\">
                <h4>Table size</h4>
              </div>
              <div class=\"form-group\">
                <label for=\"rows\">Rows</label>
                <input type=\"number\" class=\"form-control\" id=\"rows\" placeholder=\"Rows\">
              </div>
              <div class=\"form-group\">
                <label for=\"cols\">Columns</label>
                <input type=\"number\" class=\"form-control\" id=\"cols\" placeholder=\"Columns\">
              </div>
              <div class=\"form-group\">
                <h4>Table heading</h4>
              </div>
              <div class=\"form-group\">
                <button id=\"top\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"button\" aria-pressed=\"false\" autocomplete=\"off\">Top</button>
                <button id=\"left\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"button\" aria-pressed=\"false\" autocomplete=\"off\">Left</button>
              </div>
            </form>
          </div>

          <div class=\"modal-footer\">
            <button id=\"deleteTable\" type=\"button\" class=\"btn btn-danger\" data-dismiss=\"modal\">Delete table</button>
            <button id=\"customizeTable\" type=\"button\" class=\"btn btn-success\" data-dismiss=\"modal\">Customize</button>
          </div>

        </div>
      </div>
    </div>
  `).on("show.bs.modal", function (event) {

      var id = $(event.relatedTarget).parents("figure").attr("id");

      $(this).find("input#rows").val(window[id].getRows());
      $(this).find("input#cols").val(window[id].getCols());

      $("button").removeClass("active");
      if (window[id].hasTopHeading())
        $(this).find("button#top").addClass("active");
      if (window[id].hasLeftHeading())
        $(this).find("button#left").addClass("active");

      $("#deleteTable").on("click", function (event) {
        event.preventDefault();
        window[id].delete();
        window[id] = null;
      });

      $("#customizeTable").on("click", function (event) {
        event.preventDefault();
        window[id].addDelRows($("input#rows").val() - window[id].getRows());
        window[id].addDelCols($("input#cols").val() - window[id].getCols());
      });

      $("#top").on("click", function (event) {
        window[id].toggleTopHead();
      });

      $("#left").on("click", function (event) {
        window[id].toggleLeftHead();
      });
    }));
}

/** */

function addExternalLinkModal() {
  let info = {
    'id': 'linkModal',
    'selector': '#linkModal',
    'title': 'Add external link'
  }

  let html = {
    'body': `
      <p>Type the URL </p>
      <input type="text" id="linkUrl" placeholder="https://raje.com"/>
    `,
    'footer': `
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      <button type="button" class="btn btn-success" data-dismiss="modal">Add Link</button>
    `
  }

  let events = [
    {
      'selector': 'button.btn-success',
      'trigger': 'click',
      'behaviour': function () {
        let link = $(info.selector).find('input#linkUrl').val()

        $(info.selector).modal('hide');

        window['externalLink'].addLink(link);
      }
    }
  ]

  populateModal(info, html, events)
}

/** */

function addCrossRefModal() {

  let info = {
    'id': 'crossRefModal',
    'selector': '#crossRefModal',
    'title': 'Select element to reference'
  }

  let html = {
    'body': `
      ${window['crossReference'].getAllReferenceables()}
    `,
    'footer': `
      <button type="button" class="btn btn-error" data-dismiss="modal">Close</button>
      <button type="button" class="btn btn-success" data-dismiss="modal">Create reference</button>
    `
  }

  let events = [
    {
      'selector': '.list-group>a[data-ref]',
      'trigger': 'click',
      'behaviour': function () {
        let ref = $(this).data('ref')
        let type = $(this).data('type')

        $(info.selector).modal('hide');
        window['crossReference'].add(ref, type);
      }
    },
    {
      'selector': '.list-group>a[data-type="addBiblioentry"]',
      'trigger': 'click',
      'behaviour': function () {
        $(info.selector).modal('hide')

        window['crossReference'].addBiblioentry(rashEditor.insertBibliography())
      }
    },
    {
      'selector': '.list-group>a[data-type="addEndnote"]',
      'trigger': 'click',
      'behaviour': function () {
        $(info.selector).modal('hide');

        window['crossReference'].addEndnote(rashEditor.insertEndnote())
      }
    }
  ]

  populateModal(info, html, events)
}

/**  */

function addFormulaEditorModal(id) {

  let info = {
    'id': 'formulaEditorModal',
    'selector': `#formulaEditorModal`,
    'title': 'Formula editor'
  }

  let html = {
    'body': `
      <input id="sender" type="hidden" value="${id}"/>
      <div class="container-fluid">
        <div class="row">
          <div class="form-group text-center">
            <p id="formula_output" class="rash-math">\`\`\`\`</p>
          </div>
        </div>
        <div class="row">
          <textarea class="form-control" id="formula_input" columns="3"></textarea>
        </div>
        <div class="row">
          <div class="btn-group btn-group-justified" role="group" aria-label="Math formulas editor">
            <div class="btn-group" role="">
              <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Operations <span class="caret"></span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="rash-math" data-code=\"+\">       \`\`  +     \`\`</a></li>
                <li><a class="rash-math" data-code=\"-\">       \`\`  -     \`\`</a></li>
                <li><a class="rash-math" data-code=\"*\">       \`\`  *     \`\`</a></li>
                <li><a class="rash-math" data-code=\"**\">      \`\`  **    \`\`</a></li>
                <li><a class="rash-math" data-code=\"***\">     \`\`  ***   \`\`</a></li>
                <li><a class="rash-math" data-code=\"//\">      \`\`  //    \`\`</a></li>
                <li><a class="rash-math" data-code=\"\\\\\">    \`\`  \\\\  \`\`</a></li>
                <li><a class="rash-math" data-code=\"xx\">      \`\`  xx    \`\`</a></li>
                <li><a class="rash-math" data-code=\"-:\">      \`\`  -:    \`\`</a></li>
                <li><a class="rash-math" data-code=\"@\">       \`\`  @     \`\`</a></li>
                <li><a class="rash-math" data-code=\"o+\">      \`\`  o+    \`\`</a></li>
                <li><a class="rash-math" data-code=\"o.\">      \`\`  o.    \`\`</a></li>
                <li><a class="rash-math" data-code=\"sum\">     \`\`  sum   \`\`</a></li>
                <li><a class="rash-math" data-code=\"prod\">    \`\`  prod  \`\`</a></li>
                <li><a class="rash-math" data-code=\"^^\">      \`\`  ^^    \`\`</a></li>
                <li><a class="rash-math" data-code=\"^^^\">     \`\`  ^^^   \`\`</a></li>
                <li><a class="rash-math" data-code=\"vv\">      \`\`  vv    \`\`</a></li>
                <li><a class="rash-math" data-code=\"vvv\">     \`\`  vvv   \`\`</a></li>
                <li><a class="rash-math" data-code=\"nn\">      \`\`  nn    \`\`</a></li>
                <li><a class="rash-math" data-code=\"nnn\">     \`\`  nnn   \`\`</a></li>
                <li><a class="rash-math" data-code=\"uu\">      \`\`  uu    \`\`</a></li>
                <li><a class="rash-math" data-code=\"uuu\">     \`\`  uuu   \`\`</a></li>
              </ul>
            </div>
            <div class=\"btn-group\" role=\"\">
              <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">
                Misc <span class=\"caret\"></span>
              </button>
              <ul class=\"dropdown-menu\">
                <li><a class="rash-math" data-code=\"int\">     \`\`  int     \`\`</a></li>
                <li><a class="rash-math" data-code=\"oint\">    \`\`  oint    \`\`</a></li>
                <li><a class="rash-math" data-code=\"del\">     \`\`  del     \`\`</a></li>
                <li><a class="rash-math" data-code=\"grad\">    \`\`  grad    \`\`</a></li>
                <li><a class="rash-math" data-code=\"+-\">      \`\`  +-      \`\`</a></li>
                <li><a class="rash-math" data-code=\"O/\">      \`\`  O/      \`\`</a></li>
                <li><a class="rash-math" data-code=\"oo\">      \`\`  oo      \`\`</a></li>
                <li><a class="rash-math" data-code=\"aleph\">   \`\`  aleph   \`\`</a></li>
                <li><a class="rash-math" data-code=\"/_\">      \`\`  /_      \`\`</a></li>
                <li><a class="rash-math" data-code=\":.\">      \`\`  :.      \`\`</a></li>
                <li><a class="rash-math" data-code=\"|...|\">   \`\`  |...|   \`\`</a></li>
                <li><a class="rash-math" data-code=\"|cdots|\"> \`\`  |cdots| \`\`</a></li>
                <li><a class="rash-math" data-code=\"vdots\">   \`\`  vdots   \`\`</a></li>
                <li><a class="rash-math" data-code=\"ddots\">   \`\`  ddots   \`\`</a></li>
                <li><a class="rash-math" data-code=\"|__\">     \`\`  |__     \`\`</a></li>
                <li><a class="rash-math" data-code=\"__|\">     \`\`  __|     \`\`</a></li>
                <li><a class="rash-math" data-code=\"|~\">      \`\`  |~      \`\`</a></li>
                <li><a class="rash-math" data-code=\"~|\">      \`\`  ~|      \`\`</a></li>
                <li><a class="rash-math" data-code=\"CC\">      \`\`  CC      \`\`</a></li>
                <li><a class="rash-math" data-code=\"NN\">      \`\`  NN      \`\`</a></li>
                <li><a class="rash-math" data-code=\"RR\">      \`\`  RR      \`\`</a></li>
                <li><a class="rash-math" data-code=\"ZZ\">      \`\`  ZZ      \`\`</a></li>
              </ul>
            </div>
            <div class=\"btn-group\" role=\"\">
              <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">
                Relations <span class=\"caret\"></span>
              </button>
              <ul class=\"dropdown-menu\">
                <li><a class="rash-math" data-code=\"=\">       \`\`  =     \`\`</a></li>
                <li><a class="rash-math" data-code=\"!=\">      \`\`  !=    \`\`</a></li>
                <li><a class="rash-math" data-code=\"<\">       \`\`  <     \`\`</a></li>
                <li><a class="rash-math" data-code=\">\">       \`\`  >     \`\`</a></li>
                <li><a class="rash-math" data-code=\"<=\">      \`\`  <=    \`\`</a></li>
                <li><a class="rash-math" data-code=\">=\">      \`\`  >=    \`\`</a></li>
                <li><a class="rash-math" data-code=\"-<\">      \`\`  -<    \`\`</a></li>
                <li><a class="rash-math" data-code=\">-\">      \`\`  >-    \`\`</a></li>
                <li><a class="rash-math" data-code=\"in\">      \`\`  in    \`\`</a></li>
                <li><a class="rash-math" data-code=\"!in\">     \`\`  !in   \`\`</a></li>
                <li><a class="rash-math" data-code=\"sub\">     \`\`  sub   \`\`</a></li>
                <li><a class="rash-math" data-code=\"sup\">     \`\`  sup   \`\`</a></li>
                <li><a class="rash-math" data-code=\"sube\">    \`\`  sube  \`\`</a></li>
                <li><a class="rash-math" data-code=\"supe\">    \`\`  supe  \`\`</a></li>
                <li><a class="rash-math" data-code=\"-=\">      \`\`  -=    \`\`</a></li>
                <li><a class="rash-math" data-code=\"~=\">      \`\`  ~=    \`\`</a></li>
                <li><a class="rash-math" data-code=\"~~\">      \`\`  ~~    \`\`</a></li>
                <li><a class="rash-math" data-code=\"prop\">    \`\`  prop  \`\`</a></li>
              </ul>
            </div>

            <div class=\"btn-group\" role=\"\">
              <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">
                Symbols <span class=\"caret\"></span>
              </button>
              <ul class=\"dropdown-menu\">
                <li><a class="rash-math" data-code=\"and\">     \`\`  and   \`\`</a></li>
                <li><a class="rash-math" data-code=\"or\">      \`\`  or    \`\`</a></li>
                <li><a class="rash-math" data-code=\"not\">     \`\`  not   \`\`</a></li>
                <li><a class="rash-math" data-code=\"=>\">      \`\`  =>    \`\`</a></li>
                <li><a class="rash-math" data-code=\"if\">      \`\`  if    \`\`</a></li>
                <li><a class="rash-math" data-code=\"iff\">     \`\`  iff   \`\`</a></li>
                <li><a class="rash-math" data-code=\"AA\">      \`\`  AA    \`\`</a></li>
                <li><a class="rash-math" data-code=\"EE\">      \`\`  EE    \`\`</a></li>
                <li><a class="rash-math" data-code=\"_|_\">     \`\`  _|_   \`\`</a></li>
                <li><a class="rash-math" data-code=\"TT\">      \`\`  TT    \`\`</a></li>
                <li><a class="rash-math" data-code=\"|--\">     \`\`  |--   \`\`</a></li>
                <li><a class="rash-math" data-code=\"|==\">     \`\`  |==   \`\`</a></li>
              </ul>
            </div>

            <div class=\"btn-group\" role=\"\">
              <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">
                Formulas <span class=\"caret\"></span>
              </button>
              <ul class=\"dropdown-menu\">
                <li><a class="rash-math" data-code=\"|X|\">           \`\`  |X|           \`\`</a></li>
                <li><a class="rash-math" data-code=\"X!\">            \`\`  X!            \`\`</a></li>
                <li><a class="rash-math" data-code=\"sqrt(x)\">       \`\`  sqrt(x)       \`\`</a></li>
                <li><a class="rash-math" data-code=\"x^y\">           \`\`  x^y           \`\`</a></li>
                <li><a class="rash-math" data-code=\"epsilon^x\">     \`\`  epsilon^x     \`\`</a></li>
                <li><a class="rash-math" data-code=\"ln(x)\">         \`\`  ln(x)         \`\`</a></li>
                <li><a class="rash-math" data-code=\"exp(x)\">        \`\`  exp(x)        \`\`</a></li>
                <li><a class="rash-math" data-code=\"log(x)\">        \`\`  log(x)        \`\`</a></li>
                <li role="separator" class="divider"></li>
                <li><a class="rash-math" data-code=\"sin(x)\">        \`\`  sin(x)        \`\`</a></li>
                <li><a class="rash-math" data-code=\"cos(x)\">        \`\`  cos(x)        \`\`</a></li>
                <li><a class="rash-math" data-code=\"tan(x)\">        \`\`  tan(x)        \`\`</a></li>
                <li><a class="rash-math" data-code=\"cot(x)\">        \`\`  cot(x)        \`\`</a></li>
                <li><a class="rash-math" data-code=\"sinh(x)\">       \`\`  sinh(x)       \`\`</a></li>
                <li><a class="rash-math" data-code=\"cosh(x)\">       \`\`  cosh(x)       \`\`</a></li>
                <li><a class="rash-math" data-code=\"tanh(x)\">       \`\`  tanh(x)       \`\`</a></li>
                <li><a class="rash-math" data-code=\"coth(x)\">       \`\`  coth(x)       \`\`</a></li>
                <li role="separator" class="divider"></li>
                <li><a class="rash-math" data-code=\"lim_(x->oo)\">   \`\`  lim_(x->oo)   \`\`</a></li>
                <li><a class="rash-math" data-code=\"sum_(x=0)^n\">   \`\`  sum_(x=0)^n   \`\`</a></li>
                <li><a class="rash-math" data-code=\"((a,b),(c,d))\"> \`\`  ((a,b),(c,d)) \`\`</a></li>
                <li><a class="rash-math" data-code=\"[[a,b],[c,d]]\"> \`\`  [[a,b],[c,d]] \`\`</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `,
    'footer': `
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      <button type="button" class="btn btn-success">Add formula</button>
    `
  }

  let events = [
    {
      'selector': `#formula_input`,
      'trigger': 'input propertychange paste',
      'behaviour': function () {
        MathJax.Hub.Queue([
          'Text',
          MathJax.Hub.getAllJax($('#formula_output')[0])[0],
          $('#formula_input').val()
        ])
      }
    },
    {
      'selector': `li>a[data-code]`,
      'trigger': 'click',
      'behaviour': function () {

        let code = $(this).data('code')
        let text = $('#formula_input').val()

        $('#formula_input').val(text + ` ${code} `)
        MathJax.Hub.Queue([
          'Text',
          MathJax.Hub.getAllJax($('#formula_output')[0])[0],
          $('#formula_input').val()
        ])
      }
    },
    {
      'selector': `.btn-success`,
      'trigger': 'click',
      'behaviour': function () {

        let id = $('#sender').val()
        let formula = $('#formula_input').val()

        $(info.selector).modal('hide')

        window[id].addBlock(formula)
      }
    }
  ]

  opt = function () {

    MathJax.Hub.processSectionDelay = 0;
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
  }

  populateModal(info, html, events, opt)
}

/** */

function addTableSettingsModal() {
  let info = {
    'id': 'customizeTableModal',
    'selector': '#customizeTableModal',
    'title': 'Customize table'
  }

  let html = {
    'body': `
      <form>
        <div class=\"form-group\">
          <h4>Table size</h4>
        </div>

        <div class=\"form-group\">
          <label for=\"rows\">Rows</label>
          <input type=\"number\" class=\"form-control\" id=\"rows\" placeholder=\"Rows\">
        </div>

        <div class=\"form-group\">
          <label for=\"cols\">Columns</label>
          <input type=\"number\" class=\"form-control\" id=\"cols\" placeholder=\"Columns\">
        </div>

        <div class=\"form-group\">
          <h4>Table heading</h4>
        </div>
        <div class=\"form-group\">
          <button id=\"top\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"button\" aria-pressed=\"false\" autocomplete=\"off\">Top</button>
          <button id=\"left\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"button\" aria-pressed=\"false\" autocomplete=\"off\">Left</button>
        </div>
      </form> `,
    'footer': `
      <button id=\"deleteTable\" type=\"button\" class=\"btn btn-danger\" data-dismiss=\"modal\">Delete table</button>
      <button id=\"customizeTable\" type=\"button\" class=\"btn btn-success\" data-dismiss=\"modal\">Customize</button>`
  }

  let events = [
    {
      'selector': '#customizeTableModal',
      'trigger': 'show.bs.modal',
      'behaviour': function (event) {

        var id = $(event.relatedTarget).parents("figure").attr("id");

        $(this).find("input#rows").val(window[id].getRows());
        $(this).find("input#cols").val(window[id].getCols());

        $("button").removeClass("active");
        if (window[id].hasTopHeading())
          $(this).find("button#top").addClass("active");
        if (window[id].hasLeftHeading())
          $(this).find("button#left").addClass("active");

        $("#deleteTable").on("click", function (event) {
          event.preventDefault();
          window[id].delete();
          window[id] = null;
        });

        $("#customizeTable").on("click", function (event) {
          event.preventDefault();
          window[id].addDelRows($("input#rows").val() - window[id].getRows());
          window[id].addDelCols($("input#cols").val() - window[id].getCols());
        });

        $("#top").on("click", function (event) {
          window[id].toggleTopHead();
        });

        $("#left").on("click", function (event) {
          window[id].toggleLeftHead();
        });
      }
    }
  ]

  populateModal(info, html, events)
}

/** */

function selectImageFileModal(id) {
  let info = {
    'id': 'selectImageModal',
    'selector': '#selectImageModal',
    'title': 'Select image file'
  }

  let html = {
    'body': `
      <div class="container-fluid">
        <div class="row">
          <div class="form-group">
            <label for="inputFile">Select file</label>
            <p><input class="form-control" type="file" id="inputFile" accept="image/*"></p>
          </div>
          <div class="form-group">
            <label for="inputUrl">Type url</label>
            <input type="text" class="form-control" id="inputUrl" placeholder="https://rash.com/img/rash.png">
          </div>
          <p class="help-block">Select a local image <b>or</b> type a url image.</p>
        </div>
      </div>
    `,
    'footer': `
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      <button type="button" class="btn btn-success">Add image</button>
    `
  }

  let events = [
    {
      'selector': 'button.btn-success',
      'trigger': 'click',
      'behaviour': function () {

        file = $('#inputFile')[0].files[0]
        $(info.selector).modal('hide')

        if ($('#inputFile').val())
          window[id].save(file)

        else if ($('#inputUrl').val()) {
          window[id].saveFromUrl($('#inputUrl').val())
        }
      }
    }
  ]

  populateModal(info, html, events)

}

/** */

function addCommitModal() {

  let info = {
    'id': 'commitModal',
    'selector': '#commitModal',
    'title': 'Insert comment'
  }

  let html = {
    'body': `
      <p>Insert comment commit</p>
      <textarea class="form-control" type="text" id="commitMessage"></textarea>
    `,
    'footer': `
      <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      <button type="button" class="btn btn-success" data-dismiss="modal">Commit</button>
    `
  }

  let events = [
    {
      'selector': 'button.btn-success',
      'trigger': 'click',
      'behaviour': function () {
        let comment = $(info.selector).find('#commitMessage').val()
        executePush(comment)
      }
    }
  ]

  populateModal(info, html, events)
}

/**
 * 
 * Functions used to create modal programmatically
 * 
 */

function populateModal(info, html, events, opt) {

  createModal(info, html)

  if (events) {
    events.forEach(function (event) {
      $(info.selector).find(event.selector).on(event.trigger, event.behaviour)
    })
  }

  if (opt) {
    opt()
  }

  $(info.selector).modal("show")
}

function createModal(info, html) {

  $(info.selector).remove()

  $('body').append($(
    `<div id="${info.id}" class="modal fade" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title">${info.title}</h4>
          </div>
          <div class="modal-body">${html.body}</div>
          <div class="modal-footer">${html.footer}</div>
        </div>
      </div>
    </div>`))
}

var tableOptions = `
  <span data-toggle=\"modal\" data-toggle=\"modal\" data-target=\"#customizeTableModal\"
    class=\"tableOptions cgen editgen\" contenteditable=\"false\">
    <button id=\"dLabel\" type=\"button\" class=\"btn btn-default\" aria-haspopup=\"true\" aria-expanded=\"false\">
      <i class=\"fa fa-cog\" aria-hidden=\"true\"></i>
    </button>
  </span>`
  ;
function execDerash() {

  rashFile = $('<html></html>')

  rashFile.attr('xmlns', 'http://www.w3.org/1999/xhtml')
  rashFile.attr('prefix', 'schema: http://schema.org/ prism: http://prismstandard.org/namespaces/basic/2.0/')

  rashFile.append(derashHeader())
  rashFile.append(derashBody())

  let beautifiedRash = '<!DOCTYPE>\n' + beautifyRash(rashFile)[0].outerHTML
  return beautifiedRash
}

function derashHeader() {

  let head = $('<head></head>')

  /** meta */

  head.append('<meta charset="UTF-8"> </meta>')
  head.append('<meta name="viewport" content="width=device-width, initial-scale=1" />')

  /** End meta */

  /** import */

  head.append("<script>window.$ = window.jQuery = require('./js/jquery.min.js');</script>")

  if (!$('head').find('script[src="js/jquery.min.js"]').length)
    head.append('<script src="js/jquery.min.js"></script>')

  $('link[rel=stylesheet]').each(function () {
    head.append(`<link rel="stylesheet" href="${$(this).attr('href')}" />`)
  })

  $('head > script[src]').each(function () {
    head.append(`<script src="${$(this).attr('src')}"></script>`)
  })

  /** End import */


  /* .title */

  let title = $('header h1.title').text()

  if ($('header h1.title > small').length > 0) {

    let subtitle = $('header h1.title > small').text()
    title = title.replace(subtitle, '')
    title += ` -- ${subtitle}`
  }

  head.append(`<title>${title}</title>`)

  /* /End .title */

  /* authors */

  $('header address.lead.authors').each(function () {

    let email = $(this).find('code.email').text()

    head.append(`<meta about="mailto:${email}" typeof="schema:Person" property="schema:name" name="dc.creator" content="${$(this).find('strong.author_name').text()}" />`)
    head.append(`<meta about="mailto:${email}" property="schema:email" content="${email}" />`)

    $(this).find('span.affiliation').each(function (index) {

      let affiliations = [], link = $()

      //create new affiliation
      let affiliation = {
        'index': typeof $('meta[content="' + $(this).text() + '"]').attr('about') === 'undefined' ?
          'affiliation' + index :
          $('meta[content="' + $(this).text() + '"]').attr('about'),
        'content': $(this).text()
      }

      head.append(`<link about="mailto:${email}" property="schema:affiliation" href="${affiliation.index}" />`)

      //Insert the new affiliation
      affiliations.push(affiliation)

      //Lookup if an affiliation is equal as the last inserted 
      //If is true, pop the last inserted affiliation
      for (var i = 0; i < affiliations.length - 1; i++) {
        if (affiliations[i].index == affiliation.index)
          affiliations.pop()
      }

      //check if affiliation already exists
      for (var i = 0; i < affiliations.length; i++) {
        head.append(`<meta about="${affiliations[i].index}" typeof="schema:Organization" property="schema:name" content="${affiliations[i].content}"/>`)
      }
    })
  })
  /* /End authors */

  /** keywords */

  $('p.keywords li>code').each(function () {
    head.append(`<meta property="prism:keyword" content="${$(this).text()}" />`)
  })

  /** End keywords */

  /** acm subject categories */

  $('p.acm_subject_categories>code').each(function () {
    let content = collapseWhiteSpaces($(this).text())
    head.append(`<meta name="dcterms.subject" content="${content}" />`)
  })

  /** End acm subject categories */

  return head
}

function derashBody() {

  let body = $('<body></body>')

  /**  sections */

  $(rash_inline_selector + '>section').each(function () {

    let section = $('<section></section>')

    if ($(this).has('[role]')) {
      section.attr('role', $(this).attr('role'))
    }

    if ($(this).has('[id]'))
      section.attr('id', $(this).attr('id'))

    section.html(removeWhiteSpaces($(this).html()))

    body.append(section)
  })

  /** End sections */

  /** strong and bold */

  body.find('b').each(function () {
    $(this).replaceWith(`<strong>${$(this).html()}</strong>`)
  })

  body.find('i').each(function () {
    $(this).replaceWith(`<em>${$(this).html()}</em>`)
  })

  body.find('section:not([role])>li').each(function () {
    $(this).replaceWith(`<li><p>${$(this).html()}</p></li>`)
  })

  body.find('a').each(function () {
    if ($(this).has('[style]')) {
      $(this).removeAttr('style')
    }
  })

  /** End strong and bold */

  body.find('h2, h3, h4, h5, h6').each(function () {
    $(this).replaceWith(`<h1>${$(this).html()}</h1>`)
  })

  body.find('section > div').each(function () {
    if ($(this).text() != undefined)
      $(this).replaceWith(`<p>${$(this).html()}</p>`)
  })

  body.find('figure:has(span[data-mathml])').each(function () {
    let mathml = $(this).find('span[data-mathml]').data('mathml')
    $(this).html(`<p>${mathml}</p>`)
  })

  /** Handle cgen */

  body.find('strong.cgen').each(function () {
    let originalContent = $(this).data('rash-original-content')
    $(this).replaceWith(originalContent)
  })

  /** handle references */
  body.find('a[href]:has(span.cgen)').each(function () {

    let originalContent = $(this).find('span.cgen').data('rash-original-content')
    let href = $(this).attr('href')

    $(this).replaceWith(`<a href="${href}">${originalContent}</a>`)
  })

  /** handle footnote reference */

  body.find('a[href]:has(sup.cgen)').each(function () {
    let originalContent = $(this).find('sup.fn.cgen').data('rash-original-content')
    let href = $(this).attr('href')
    $(this).replaceWith(`<a href="${href}">${originalContent}</a>`)
  })

  body.find('section[role="doc-endnotes"]>section:not([role])').each(function () {
    $(this).remove()
  })

  body.find('a[name][title]').each(function () {
    $(this).remove()
  })

  /** replace &nbsp; with blank */

  body.find('*').each(function () {

    $(this).html($(this).html().replace(ONE_SPACE, ' '))

    if ($(this).html() == '')
      $(this).remove()
  })

  body.find('p').each(function () {
    let text = removeWhiteSpaces($(this).html())
    if (text == '')
      $(this).remove()
  })

  /** End notes */

  body.find('section[role="doc-endnotes"]>h1').remove()

  body.find('section[role="doc-endnotes"]>section').each(function () {
    $(this).find('sup.hidden-print.cgen').remove()
  })

  return body
}

function beautifyRash(article) {

  let headElements = 'script,title,link,meta',
    blocks = 'figcaption, h1, p, pre, th',
    containers = 'blockquote, figure, html, li, ol, section, table, td, tr, ul'

  article.find(blocks + ',' + headElements).each(function () {
    let count = $(this).parents('*').length
    let html = addTabs(count, $(this)[0].outerHTML) + '\n'

    $(this).replaceWith(html)
  })

  article.find('li').each(function () {
    handleContainer($(this))
  })

  article.find('ol,ul').each(function () {
    handleContainer($(this))
  })

  article.find('blockquote').each(function () {
    handleContainer($(this))
  })

  article.find('td').each(function () {
    handleContainer($(this))
  })

  article.find('tr').each(function () {
    handleContainer($(this))
  })

  article.find('tbody').each(function () {
    handleContainer($(this))
  })
  article.find('table').each(function () {
    handleContainer($(this))
  })

  article.find('figure').each(function () {
    handleContainer($(this))
  })

  handleSections(article)

  article.find('body,head').prepend('\n')
  article.find('body').append('\n')

  article.find('body,head').before('\n')
  article.find('body').after('\n')

  return article
}

function handleSections(article) {

  let selector = 'section>section>section>section>section>section',
    deepness = selector.split('>')

  while (deepness.length > 0) {
    article.find(selector).each(function () {
      handleContainer($(this))
    })
    deepness.pop()
    selector = deepness.join('>')
  }
}

/**  */

function handleContainer(container) {
  container.prepend('\n')
  container.replaceWith(addTabsToContainers(container.parents().length, container[0].outerHTML) + '\n')
}

function addTabs(count, element) {

  let tabs = ''
  do {
    tabs += TAB
    count--
  } while (count > 0)
  return tabs + element
}

function addTabsToContainers(count, element) {

  let tabs = ''
  do {
    tabs += TAB
    count--
  } while (count > 0)
  return indentClosingTag(tabs, tabs + element)
}

function collapseWhiteSpaces(string) {
  return string.replace(/\s\s+/g, ' ')
}

function removeWhiteSpaces(string) {
  return string.replace(/\s\s+/g, '')
}

function indentClosingTag(tabs, string) {
  let array = string.split('</')
  if (array.length >= 2) {
    array[array.length - 2] += tabs
    return array.join('</')
  }
}
const {ipcRenderer} = require('electron'),
  fs = require('fs')

/** Receive settings info (3) */
ipcRenderer.on('githubSettings', (event, args) => {

  window['settings'] = args
  console.log(settings)
})

ipcRenderer.on('addNewAuthor', (event, arg) => {

  rashEditor.header.insertPlaceholderAuthor()
})

ipcRenderer.on('setRemoveAuthors', (event, arg) => {

  rashEditor.header.setRemoveAuthors()
})

ipcRenderer.on('unsetRemoveAuthors', (event, arg) => {

  rashEditor.header.unsetRemoveAuthors()
})

ipcRenderer.on('setReorganizeAuthors', (event, arg) => {

  rashEditor.header.setReorganizeAuthors()
})

ipcRenderer.on('unsetReorganizeAuthors', (event, arg) => {

  rashEditor.header.unsetReorganizeAuthors()
})

ipcRenderer.on('setPreviewMode', (event, arg) => {

  $(rash_inline_selector).setNotEditable()
})

ipcRenderer.on('setEditorMode', (event, arg) => {

  $(rash_inline_selector).setEditable()
})

ipcRenderer.on('doSavefromMain', (event, arg) => {

  if (arg)
    executeSaveSync()

  else
    executeSave()

})

/** check if is connected */
function checkLogin() {
  return typeof window['settings'] !== 'undefined'
}

function checkSoftware() {
  return ipcRenderer.sendSync('isSoftware')
}
/** Do login */
function githubLogin() {
  ipcRenderer.send('doGithubOAuth')
}

/** Do logout */
function githubLogout() {
  if (ipcRenderer.send('githubLogout') == 1)
    window['settings'] = null
}

function executeSave() {

  //set edit_state and body content
  updateEditState()

  ipcRenderer.send('doSave', execDerash())
}

function executeSaveSync() {

  //set edit_state and body content
  updateEditState()

  ipcRenderer.sendSync('doSaveSync', execDerash())
  ipcRenderer.send('closeWindow')
}

function executePush(comment) {
  ipcRenderer.send('doPush', { 'comment': comment, 'article': execDerash() })
}

function sendWriteFigure(file) {
  ipcRenderer.sendSync('writeFigureSync', { 'name': file.name, 'path': file.path })
}

function sendWriteFigureFromUrl(url) {
  return ipcRenderer.sendSync('writeFigureFromUrlSync', { 'url': url })
}

function setEditState() {
  ipcRenderer.send('setEditState', edit_state)
}

window['settings'] = ipcRenderer.sendSync('getGithubSettingsSync')
console.log(settings)

