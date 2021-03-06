var settingsRoute;

module('Marketplace Settings', {
	setup: function() {
		Balanced.TEST.setupMarketplace();
		settingsRoute = '/marketplaces/' + Balanced.TEST.MARKETPLACE_ID + '/settings';
		Ember.run(function() {

			Balanced.BankAccount.create({
				uri: '/customers/' + Balanced.TEST.CUSTOMER_ID + '/bank_accounts',
				name: 'Test Account',
				account_number: '1234',
				routing_number: '122242607',
				type: 'checking'
			}).save().then(function(bankAccount) {
				Balanced.TEST.BANK_ACCOUNT_ID = bankAccount.get('id');
			});

			Balanced.Card.create({
				uri: '/customers/' + Balanced.TEST.CUSTOMER_ID + '/cards',
				number: '4444400012123434',
				name: 'Test Card',
				expiration_year: 2020,
				expiration_month: 11
			}).save().then(function(card) {
				Balanced.TEST.CARD_ID = card.get('id');
			});

			Balanced.Callback.create({
				uri: '/callbacks',
				url: 'http://api.com/something'
			}).save();

		});
	},
	teardown: function() {
		$("#add-bank-account").modal('hide');
		$("#delete-bank-account").modal('hide');
		$("#add-card").modal('hide');
		$("#delete-card").modal('hide');
		$("#add-callback").modal('hide');
		$("#delete-callback").modal('hide');
		$('#edit-marketplace-info').modal('hide');
		$('#edit-owner-info').modal('hide');
	}
});

test('can visit page', function(assert) {
	visit(settingsRoute)
		.then(function() {
			var $title = $('#content h1');
			assert.notEqual($title.text().indexOf('Settings'), -1, 'Title is not correct');
		});
});

test('can update marketplace info', function(assert) {
	visit(settingsRoute).then(function() {
		var model = Balanced.__container__.lookup('controller:marketplaceSettings').get('model');
		model.set('production', true);

		Ember.run.next(function() {
			click('.marketplace-info a.edit')
			.fillIn('#edit-marketplace-info .modal-body input[name="name"]', 'Test')
			.click('#edit-marketplace-info .modal-footer button[name="modal-submit"]')
			.then(function() {
				// Marketplace name should have changed
				assert.equal($('.marketplace-info div.control-group:nth-child(2) .inline-label').text().trim(), 'Test');
			});
		});
	});
});

test('updating marketplace info only submits once despite multiple clicks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "update");

	visit(settingsRoute).then(function() {
		var model = Balanced.__container__.lookup('controller:marketplaceSettings').get('model');
		model.set('production', true);

		Ember.run.next(function() {
			click('.marketplace-info a.edit')
			.fillIn('#edit-marketplace-info .modal-body input[name="name"]', 'Test')
			.click('#edit-marketplace-info .modal-footer button[name="modal-submit"]')
			.click('#edit-marketplace-info .modal-footer button[name="modal-submit"]')
			.click('#edit-marketplace-info .modal-footer button[name="modal-submit"]')
			.then(function() {
				assert.ok(stub.calledOnce);
			});
		});
	});
});

test('can update owner info', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "update");

	visit(settingsRoute).then(function() {
		var model = Balanced.__container__.lookup('controller:marketplaceSettings').get('model');
		model.set('owner_customer', Balanced.Customer.create());
		model.set('production', true);

		Ember.run.next(function() {
			click('.owner-info a.edit')
			.fillIn('#edit-customer-info .modal-body input[name="name"]', 'TEST')
			.fillIn('#edit-customer-info .modal-body input[name="email"]', 'TEST@example.com')
			.fillIn('#edit-customer-info .modal-body input[name="business_name"]', 'TEST')
			.fillIn('#edit-customer-info .modal-body input[name="ein"]', '1234')
			.click('#edit-customer-info a.more-info')
			.fillIn('#edit-customer-info .modal-body input[name="line1"]', '600 William St')
			.fillIn('#edit-customer-info .modal-body input[name="line2"]', 'Apt 400')
			.fillIn('#edit-customer-info .modal-body input[name="city"]', 'Oakland')
			.fillIn('#edit-customer-info .modal-body input[name="state"]', 'CA')
			.fillIn('#edit-customer-info .modal-body select[name="country_code"]', 'US')
			.fillIn('#edit-customer-info .modal-body input[name="postal_code"]', '12345')
			.fillIn('#edit-customer-info .modal-body input[name="phone"]', '1231231234')
			.fillIn('#edit-customer-info .modal-body input[name="dob_month"]', '12')
			.fillIn('#edit-customer-info .modal-body input[name="dob_year"]', '1924')
			.fillIn('#edit-customer-info .modal-body input[name="ssn_last4"]', '1234')
			.click('#edit-customer-info .modal-footer button[name="modal-submit"]')
			.then(function() {
				assert.ok(stub.calledOnce);
				assert.ok(stub.calledWith(Balanced.Customer));
				assert.equal(stub.getCall(0).args[2].name, "TEST");
				assert.equal(stub.getCall(0).args[2].email, "TEST@example.com");
				assert.equal(stub.getCall(0).args[2].business_name, "TEST");
				assert.equal(stub.getCall(0).args[2].ein, "1234");
				assert.equal(stub.getCall(0).args[2].address.line1, "600 William St");
				assert.equal(stub.getCall(0).args[2].address.line2, "Apt 400");
				assert.equal(stub.getCall(0).args[2].address.city, "Oakland");
				assert.equal(stub.getCall(0).args[2].address.state, "CA");
				assert.equal(stub.getCall(0).args[2].address.country_code, "US");
				assert.equal(stub.getCall(0).args[2].address.postal_code, "12345");
				assert.equal(stub.getCall(0).args[2].phone, "1231231234");
				assert.equal(stub.getCall(0).args[2].dob_month, "12");
				assert.equal(stub.getCall(0).args[2].dob_year, "1924");
				assert.equal(stub.getCall(0).args[2].ssn_last4, "1234");
			});
		});
	});
});

test('can create checking accounts', function(assert) {
	//var createSpy = sinon.spy(Balanced.Adapter, "create");
	var tokenizingStub = sinon.stub(balanced.bankAccount, "create");
	tokenizingStub.callsArgWith(1, {
		status: 201,
		bank_accounts: [{
			href: '/bank_accounts/' + Balanced.TEST.BANK_ACCOUNT_ID
		}]
	});

	visit(settingsRoute)
		.click('.bank-account-info a.add')
		.fillIn('#add-bank-account .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-bank-account .modal-body input[name="account_number"]', '123')
		.fillIn('#add-bank-account .modal-body input[name="routing_number"]', '123123123')
		.click('#add-bank-account .modal-body input[name="account_type"][value="checking"]')
		.click('#add-bank-account .modal-footer button[name="modal-submit"]')
		.then(function() {
			// test balanced.js
			assert.ok(tokenizingStub.calledOnce);
			assert.ok(tokenizingStub.calledWith({
				type: "checking",
				name: "TEST",
				account_number: "123",
				routing_number: "123123123"
			}));
			balanced.bankAccount.create.restore();
			/*
			assert.ok(createSpy.calledOnce);
			assert.ok(createSpy.calledWith(Balanced.BankAccount, '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/bank_accounts', {
				bank_account_uri: '/v1/bank_accounts/deadbeef'
			}));
			*/
		});
});

test('can create savings accounts', function(assert) {
	//var createSpy = sinon.spy(Balanced.Adapter, "create");
	var tokenizingStub = sinon.stub(balanced.bankAccount, "create");
	tokenizingStub.callsArgWith(1, {
		status: 201,
		bank_accounts: [{
			href: '/bank_accounts/' + Balanced.TEST.BANK_ACCOUNT_ID
		}]
	});

	visit(settingsRoute)
		.click('.bank-account-info a.add')
		.fillIn('#add-bank-account .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-bank-account .modal-body input[name="account_number"]', '123')
		.fillIn('#add-bank-account .modal-body input[name="routing_number"]', '123123123')
		.click('#add-bank-account .modal-body input[name="account_type"][value="savings"]')
		.click('#add-bank-account .modal-footer button[name="modal-submit"]')
		.then(function() {
			// test balanced.js
			assert.ok(tokenizingStub.calledOnce);
			assert.ok(tokenizingStub.calledWith({
				type: "savings",
				name: "TEST",
				account_number: "123",
				routing_number: "123123123"
			}));
			balanced.bankAccount.create.restore();
			/*
			assert.ok(createSpy.calledOnce);
			assert.ok(createSpy.calledWith(Balanced.BankAccount, '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/bank_accounts', {
				bank_account_uri: '/v1/bank_accounts/deadbeef'
			}));
			*/
		});
});

test('create bank account only submits once when clicked multiple times', function(assert) {
	var spy = sinon.spy(balanced.bankAccount, 'create');
	var model;

	visit(settingsRoute)
		.click('.bank-account-info a.add')
		.fillIn('#add-bank-account .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-bank-account .modal-body input[name="account_number"]', '123')
		.fillIn('#add-bank-account .modal-body input[name="routing_number"]', '123123123')
		.click('#add-bank-account .modal-body input[name="account_type"][value="checking"]')
		.click('#add-bank-account .modal-footer button[name="modal-submit"]')
		.click('#add-bank-account .modal-footer button[name="modal-submit"]')
		.click('#add-bank-account .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
			balanced.bankAccount.create.restore();
		});
});

test('can delete bank accounts', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "delete");
	var initialLength;
	var bankAccounts = Balanced.BankAccount.findAll();
	var model;

	visit(settingsRoute)
		.then(function() {
			/**
			 * WORKAROUND: I think there may be something weird happening
			 * with the custom models when it is in synchronous mode.
			 */
			model = Balanced.__container__.lookup('controller:marketplaceSettings').get('model');
			model.set('owner_customer', Ember.Object.create());
			model.set('owner_customer.bank_accounts', bankAccounts);

			Ember.run.next(function() {
				initialLength = $('.bank-account-info .sidebar-items li').length;

				click(".bank-account-info .sidebar-items li:eq(0) .icon-delete")
				.click('#delete-bank-account .modal-footer button[name="modal-submit"]')
				.then(function() {
					/**
					 * WORKAROUND: since the test runner is synchronous,
					 * lets force the model into a saving state.
					 */
					bankAccounts.get('content').forEach(function(bankAccount) {
						bankAccount.set('isSaving', true);
					});

					Ember.run.next(function() {
						click('#delete-bank-account .modal-footer button[name="modal-submit"]');
					});
				})
				.then(function() {
					assert.equal($('.bank-account-info .sidebar-items li').length, initialLength - 1);
					assert.ok(spy.calledOnce, "Delete should have been called once");
				});
			});
		});
});

test('can create cards', function(assert) {
	//var createSpy = sinon.spy(Balanced.Adapter, "create");
	var tokenizingStub = sinon.stub(balanced.card, "create");
	tokenizingStub.callsArgWith(1, {
		status: 201,
		cards: [{
			href: '/cards/' + Balanced.TEST.CARD_ID
		}]
	});
	var model;

	visit(settingsRoute)
		.click('.card-info a.add')
		.fillIn('#add-card .modal-body input[name="name"]', 'TEST')
		.fillIn('#add-card .modal-body input[name="number"]', '1234123412341234')
		.fillIn('#add-card .modal-body input[name="security_code"]', '123')
		.then(function() {
			$('#add-card .modal-body select[name="expiration_month"]').val('1').change();
			$('#add-card .modal-body select[name="expiration_year"]').val('2020').change();
		})
		.click('#add-card .modal-footer button[name="modal-submit"]')
		.then(function() {
			/**
			 * WORKAROUND: since the test runner is synchronous,
			 * lets force the model into a saving state.
			 */
			model = Balanced.__container__.lookup('controller:marketplaceSettings').get('model');
			model.set('isSaving', true);

			Ember.run.next(function() {
				click('#add-card .modal-footer button[name="modal-submit"]');
			});
		})
		.then(function() {
			assert.ok(tokenizingStub.calledWith(sinon.match({
				name: "TEST",
				number: "1234123412341234",
				security_code: "123",
				expiration_month: 1,
				expiration_year: 2020
			})));
			assert.ok(tokenizingStub.calledOnce);
			/*assert.ok(createSpy.calledOnce);
			assert.ok(createSpy.calledWith(Balanced.Card, '/v1/customers/' + Balanced.TEST.CUSTOMER_ID + '/cards', {
				card_uri: '/v1/cards/deadbeef'
			}));*/
			balanced.card.create.restore();
		});
});

test('can delete cards', function(assert) {
	var spy = sinon.spy(Balanced.Adapter, "delete");
	var cards = Balanced.Card.findAll();
	var model;

	visit(settingsRoute)
		.then(function() {
			/**
			 * WORKAROUND: I think there may be something weird happening
			 * with the custom models when it is in synchronous mode.
			 */
			model = Balanced.__container__.lookup('controller:marketplaceSettings').get('model');
			model.set('owner_customer', Ember.Object.create());
			model.set('owner_customer.cards', cards);

			Ember.run.next(function() {
				assert.equal($('.card-info .sidebar-items li').length, 1);
				
				click(".card-info .sidebar-items li:eq(0) .icon-delete")
				.click('#delete-card .modal-footer button[name="modal-submit"]')
				.then(function() {
					/**
					 * WORKAROUND: since the test runner is synchronous,
					 * lets force the model into a saving state.
					 */
					model.set('isSaving', true);

					Ember.run.next(function() {
						click('#delete-card .modal-footer button[name="modal-submit"]');
					});
				})
				.then(function() {
					assert.equal($('.card-info .sidebar-items li').length, 0);
					assert.ok(spy.calledOnce, "Delete should have been called once");
				});
			});
		});
});

test('shows webhooks', function(assert) {
	visit(settingsRoute)
		.then(function() {
			assert.equal($('ul.webhooks li').length, 1);
		});
});

test('can add webhooks', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(settingsRoute)
		.click(".webhook-info .add")
		.fillIn("#add-callback .modal-body input[name='url']", 'http://www.example.com/something')
		.click('#add-callback .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('webhooks get created once if submit button is clicked multiple times', function(assert) {
	var stub = sinon.stub(Balanced.Adapter, "create");

	visit(settingsRoute)
		.click(".webhook-info .add")
		.fillIn("#add-callback .modal-body input[name='url']", 'http://www.example.com/something')
		.click('#add-callback .modal-footer button[name="modal-submit"]')
		.click('#add-callback .modal-footer button[name="modal-submit"]')
		.click('#add-callback .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(stub.calledOnce);
		});
});

test('can delete webhooks', function(assert) {
	visit(settingsRoute)
		.click('ul.webhooks li:eq(0) a')
		.click('#delete-callback .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.equal($('ul.webhooks li').length, 0);
		});
});

test('delete webhooks only submits once even if clicked multiple times', function(assert) {
	var spy = sinon.stub(Balanced.Adapter, "delete");

	visit(settingsRoute)
		.click('ul.webhooks li:eq(0) a')
		.click('#delete-callback .modal-footer button[name="modal-submit"]')
		.click('#delete-callback .modal-footer button[name="modal-submit"]')
		.click('#delete-callback .modal-footer button[name="modal-submit"]')
		.click('#delete-callback .modal-footer button[name="modal-submit"]')
		.then(function() {
			assert.ok(spy.calledOnce);
		});
});
