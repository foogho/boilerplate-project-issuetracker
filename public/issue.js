'use strict';

// configure jquery ajax global events to show/hide loading spinner
$(document)
  .on('ajaxStart', () => {
    $('#loadingSpinner').removeClass("d-none");
  })
  .on('ajaxStop', () => {
    $('#loadingSpinner').addClass("d-none");
  });

// configure jquery ajax to show request responses and errors in toasts
$.ajaxSetup({
  success: (res) => {
    const toastEl = $('#AJAXResultToast');
    toastEl
      .addClass('text-bg-success')
      .find('.toast-body')
      .text(res.result ? res.result : 'request completed successfully');
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
  },
  error: (err) => {
    const toastEl = $('#AJAXResultToast');
    toastEl
      .addClass('text-bg-danger')
      .find('.toast-body')
      .text(err.responseJSON.error);
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
  },
});

let fetchedIssues;
let projectTitle;
let viewedIssue;

$(document).ready(function () {
  projectTitle = getProjectTitle();
  $.ajaxSetup({
    url: `/api/issues/${projectTitle}`,
  });
  renderProjectTitle();
  renderIssues();
  $('#createIssueModal').find('form').on('submit', onCreateOrModifyIssueSubmit);
  $('#modifyIssueModal')
    .on('show.bs.modal', function (e) {
      const viewedIssueIdx = e.relatedTarget.getAttribute('data-issueIdx');
      viewedIssue = fetchedIssues[viewedIssueIdx];
      setViewedIssueToForm.call(this);
    })
    .find('form')
    .on('submit', onCreateOrModifyIssueSubmit);
  $('#deleteIssueBtn').on('click', deleteIssue);
});

function getProjectTitle() {
  return window.location.pathname.split('/')[1];
}

function renderProjectTitle() {
  $('#projectTitle').text(`${projectTitle} project`);
}

function renderIssues() {
  $.ajax({
    success: function (issues) {
      fetchedIssues = issues;
      if (issues.length === 0) {
        $('#issueEmptyListTemplate').removeClass('d-none');
      } else {
        $('#issueTable')
          .removeClass('d-none')
          .find('tbody')
          .html(
            issues.map(
              (issue, i) => `<tr>
              <th>${i + 1}</th>
        <td>${issue._id}</td>
        <td>${issue.issue_title}</td>
        <td>${issue.created_by}</td>
        <td>${issue.open ? 'open' : 'closed'}</td>
        <td><button class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#modifyIssueModal" data-issueIdx="${i}">View</button></td>
        </tr>`
            )
          );
      }
    },
  });
}

function onCreateOrModifyIssueSubmit(event) {
  event.preventDefault();
  const formData = extractFormDataAsJSON($(this));
  $.ajax({
    method: event.target.id === 'createIssueForm' ? 'POST' : 'PUT',
    data: formData,
  });
}

function setViewedIssueToForm() {
  for (let formControl of Array.from(
    $(this).find('form :not([type="hidden"])[name]')
  )) {
    const issueField = viewedIssue[formControl.getAttribute('name')];
    if (formControl.getAttribute('type') === 'checkbox') {
      formControl.checked = issueField;
    } else {
      formControl.value = issueField;
    }
  }
}

function deleteIssue() {
  confirm('are you sure?')
    ? $.ajax({
        method: 'DELETE',
        data: {
          _id: viewedIssue._id,
        },
      })
    : '';
}

// since jquery form element wrapper doesn't have a method to get form data
// as JSON this method help us about this
function extractFormDataAsJSON(jqueryFormEl) {
  const data = {};
  jqueryFormEl.serializeArray().forEach((el) => {
    data[el.name] = el.value;
  });
  return data;
}
