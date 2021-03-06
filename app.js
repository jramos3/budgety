
//LOCAL STORAGE CONTROLLER
var LSController = (function() {

  return {
    getDataFromLS: function() {
      var data;

      data = JSON.parse(localStorage.getItem("data"));

      if(!data) {
        data = {
          allItems: {
            exp: [],
            inc: []
          },
          totals: {
            exp: 0,
            inc: 0
          },
          budget: 0,
          percentage: -1
        };
      }
      
      return data;
    },

    storeDataOnLS: function(data) {
      localStorage.setItem("data", JSON.stringify(data));
    },

    resetLS: function() {
      var day;

      day = new Date();
      day = day.getDate();

      if(day === 1) {
        localStorage.clear();
      }
    }
    
  }
})();


//BUDGET CONTROLLER
var budgetController = (function(LSCtrl) {

  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function(totalIncome) {
    if(totalIncome > 0) {
      this.percentage = Math.round( (this.value / totalIncome) * 100 );
    }
  };

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  }

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function(type) {
    var sum = 0;

    data.allItems[type].forEach(function(el) {
      sum += el.value;
    });

    data.totals[type] = sum;
  };

  var data = LSCtrl.getDataFromLS();

  data.allItems.exp.forEach(function(expense) {
    Object.setPrototypeOf(expense, Expense.prototype);
  });

  return {
    addItem: function(type, des, val) {
      var newItem, ID;

      //Create new ID
      if(data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }
      

      //Create new Item
      if(type === "exp") {
        newItem = new Expense(ID, des, val);
      } else if(type === "inc") {
        newItem = new Income(ID, des, val);
      }

      //Push newItem onto data
      data.allItems[type].push(newItem);

      //Update data on LS
      LSCtrl.storeDataOnLS(data);

      return newItem;
    },

    deleteItem: function(type, id) {
      var ids, index;

      
      ids = data.allItems[type].map(function(current) {
        return current.id;
      })

      index = ids.indexOf(id);

      if(index !== -1) {
        data.allItems[type].splice(index, 1);
      }

      //Update data on LS
      LSCtrl.storeDataOnLS(data);
    },

    calculateBudget: function() {

      //calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");

      //calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      //calculte the expeses as percentage of income
      if(data.totals.inc > 0) {
        data.percentage = Math.round( (data.totals.exp / data.totals.inc) * 100 );
      }

      LSCtrl.storeDataOnLS(data);
    },

    calculatePercentages: function() {
      data.allItems.exp.forEach(function(current) {
        current.calcPercentage(data.totals.inc);

        LSCtrl.storeDataOnLS(data);
      });
    },

    getPercentages: function() {
      var allPerc = data.allItems.exp.map(function(current) {
        return current.getPercentage();
      })

      return allPerc;
    },

    getBudget: function() {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      };
    },

    getAllIncomesFromLS: function() {
      return data.allItems.inc;
    },

    getAllExpensesFromLS: function() {
      return data.allItems.exp;
    },

    //testing method only!
    testing: function() {
      console.log(data);
    }
  };

})(LSController);



//UI CONTROLLER
var UIController = (function() {

  var DOMStrings = {
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expensesContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expensesLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercLabel: ".item__percentage",
    dateLabel: ".budget__title--month"
  };

  var formatNumber = function(num, type) {
    var numSplit, int, dec;
    
    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split(".");
    int = numSplit[0];
    dec = numSplit[1];

    if(int.length > 3) {
      int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ","); //thousand separator
    }

    return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
  };

  return {  
    getInput: function() {
      return {
        type: document.querySelector(DOMStrings.inputType).value,
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      };
    },

    addListItem: function(obj, type) {
      var html, newHtml, element;

      //Create HTML string with placeholder text
      if(type === "inc") {
        element = DOMStrings.incomeContainer;

        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if(type === "exp") {
        element = DOMStrings.expensesContainer;

        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace the placeholer text with some actual data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));

      //Insert the HTML element to the DOM
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },

    deleteListItem: function(selectorID) {
      var el = document.getElementById(selectorID);

      el.parentNode.removeChild(el);
    },

    clearFields: function() {
      var fields;

      fields = document.querySelectorAll(DOMStrings.inputDescription + "," + DOMStrings.inputValue);
      
      fields.forEach(function(field) {
        field.value = "";
      });

      fields[0].focus();
    },

    displayBudget: function(obj) {
      var type;

      obj.budget > 0 ? type = "inc" : type = "exp";

      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
      document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, "exp");
      document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage;

      if(obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + "%";
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "---";
      }

    },

    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMStrings.expensesPercLabel);

      fields.forEach(function(field, index) {
        if(percentages[index] > 0) {
          field.textContent = percentages[index] + "%";
        } else {
          field.textContent = "---";
        }
        
      });
    },
    
    displayMonth: function() {
      var now, year, month, months;

      months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

      now = new Date();
      month = now.getMonth();
      year = now.getFullYear();

      document.querySelector(DOMStrings.dateLabel).textContent = months[month] + " " + year;
    },

    changeType: function() {

      var fields = document.querySelectorAll(
        DOMStrings.inputType + "," +
        DOMStrings.inputDescription + "," +
        DOMStrings.inputValue
      );

      fields.forEach(function(field) {
        field.classList.toggle("red-focus");
      });

      document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
    },

    getDOMStrings: function() {
      return DOMStrings;
    }
  
  };

})();



//GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl, LSCtrl) {

  var setupEventListeners = function() {
    var DOM = UICtrl.getDOMStrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

    document.addEventListener("keypress", function(event) {
      if(event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener("change", UICtrl.changeType);

  }
  
  var updateBudget = function() {
    var budget;

    //1. Calculate the budget
    budgetCtrl.calculateBudget();

    //2. Return the budget
    budget = budgetCtrl.getBudget();

    //3. Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function() {
    var percentages;

    //1. Calculate the percentages
    budgetCtrl.calculatePercentages();

    //2. Read percentages from the budget controller
    percentages = budgetCtrl.getPercentages();

    //3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function() {
    var input, newItem;

    //1. Get the input data
    input = UICtrl.getInput();

    if(input.description.trim() !== "" && !isNaN(input.value) && input.value > 0) {
      //2. Add the item to the budget controller
      newItem = budgetController.addItem(input.type, input.description, input.value);

      //3. Add the item to the UI
      UICtrl.addListItem(newItem, input.type);

      //4. Clear the fields
      UICtrl.clearFields();

      //5. Calculate and update budget
      updateBudget();

      //6. Calculate and update the percentages
      updatePercentages();
    }
  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID, type, ID ;

    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
    
    if(itemID) {
      splitID = itemID.split("-");
      type = splitID[0];
      ID = parseInt(splitID[1]);

      //1. delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);

      //2. delete the item from the UI
      UICtrl.deleteListItem(itemID);

      //3. update and show the new budget
      updateBudget();

      //4. Calculate and update the percentages
      updatePercentages();
    }
  };

  var displayItemsFromLS = function() {
    var budget, incomes, expenses, percentages;

    budget = budgetCtrl.getBudget();
    UICtrl.displayBudget(budget);

    incomes = budgetCtrl.getAllIncomesFromLS();
    expenses = budgetCtrl.getAllExpensesFromLS();  
    percentages = budgetCtrl.getPercentages();

    incomes.forEach(function(income) {
      UICtrl.addListItem(income, "inc");
    });

    expenses.forEach(function(expense) {
      UICtrl.addListItem(expense, "exp");
    });

    UICtrl.displayPercentages(percentages);

  };

  return {
    init: function() {
      console.log("Application has started!");

      LSCtrl.resetLS();

      displayItemsFromLS();

      setupEventListeners();

      UICtrl.displayMonth();

    }
  }

})(budgetController, UIController, LSController);

controller.init();