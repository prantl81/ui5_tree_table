(function() {
    let _shadowRoot;
    let _id;
    window.globVar_UI5_Table = "";

    let tmpl = document.createElement("template");
    tmpl.innerHTML = `
        <style>
        </style>
        <div id="ui5_content" name="ui5_content">
         <slot name="content"></slot>
        </div>
   `;





// ------------------------------------------------------------------
    class Ui5TreeTable extends HTMLElement {

        constructor() {
            super();

            _shadowRoot = this.attachShadow({
                mode: "open"
            });
            _shadowRoot.appendChild(tmpl.content.cloneNode(true));



            //empty properties
            this.properties = {};
            //empty selection state
            this.selectionState = {};


            //Initialize the UI5 component(s)
            this.initializeUI5Component();

          } //constructor

          fireEventCheckBoxChange(selectionDetails, parameter) {
              console.log("Event fire: CheckBoxChange");
              console.log(selectionDetails);
              //Store the rowDetails
              this.selectionState.checkBoxChanged = selectionDetails;
              this.selectionState.checkBoxColumn = parameter;
              //Dispatch event towards SAC
              this.dispatchEvent(new Event("onCheckBoxChange", { }));
          }



          // ---------------   Standard Methods --------------------------------

          // executed Jbefore the properties of the custom widget are updated.
          onCustomWidgetBeforeUpdate(changedProperties) {
              if ("designMode" in changedProperties) {
                  this._designMode = changedProperties["designMode"];
              }
              
          }



          // executed after the properties of the custom widget have been updated.
          onCustomWidgetAfterUpdate(changedProperties) {

          }



          // executed when this Web Component of the custom widget is connected to the HTML DOM of the web page.
          connectedCallback() {

              try {
                  if (window.commonApp) {
                      let outlineContainer = commonApp.getShell().findElements(true, ele => ele.hasStyleClass && ele.hasStyleClass("sapAppBuildingOutline"))[0]; // sId: "__container0"

                      if (outlineContainer && outlineContainer.getReactProps) {
                          let parseReactState = state => {
                              let components = {};

                              let globalState = state.globalState;
                              let instances = globalState.instances;
                              let app = instances.app["[{\"app\":\"MAIN_APPLICATION\"}]"];
                              let names = app.names;

                              for (let key in names) {
                                  let name = names[key];

                                  let obj = JSON.parse(key).pop();
                                  let type = Object.keys(obj)[0];
                                  let id = obj[type];

                                  components[id] = {
                                      type: type,
                                      name: name
                                  };
                              }

                              for (let componentId in components) {
                                  let component = components[componentId];
                              }

                              let metadata = JSON.stringify({
                                  components: components,
                                  vars: app.globalVars
                              });

                              if (metadata != this.metadata) {
                                  this.metadata = metadata;

                                  this.dispatchEvent(new CustomEvent("propertiesChanged", {
                                      detail: {
                                          properties: {
                                              metadata: metadata
                                          }
                                      }
                                  }));
                              }
                          };

                          let subscribeReactStore = store => {
                              this._subscription = store.subscribe({
                                  effect: state => {
                                      parseReactState(state);
                                      return {
                                          result: 1
                                      };
                                  }
                              });
                          };

                          let props = outlineContainer.getReactProps();
                          if (props) {
                              subscribeReactStore(props.store);
                          } else {
                              let oldRenderReactComponent = outlineContainer.renderReactComponent;
                              outlineContainer.renderReactComponent = e => {
                                  let props = outlineContainer.getReactProps();
                                  subscribeReactStore(props.store);

                                  oldRenderReactComponent.call(outlineContainer, e);
                              }
                          }
                      }
                  }
              } catch (e) {}
          }



          // executed when this Web Component of the custom widget is disconnected from the HTML DOM of the web page.
          disconnectedCallback() {
              if (this._subscription) {
                  this._subscription();
                  this._subscription = null;
              }
          }



          // execute JavaScript code when the custom widget is resized
          onCustomWidgetResize(width, height) {
          }



          // ---------------   Property Setter/Getter Functions

          set rowsVisible(newValue) {
              this.properties.rowsVisible = parseInt(newValue);
              this.syncProperties("rowsVisible");
          }

          get rowsVisible() {
              return this.properties.rowsVisible;
          }






          //Utility method to push properties to UI5 control
          // - without parameter -> push all properties
          // - with parameter -> push single proprty
          syncProperties(property) {
              //Controller not avialable yet - do nothing
              if (!this.controller) {
                return;
              }

              if (!property || property == "rowsVisible") {
                  this.controller.setVisibleRowCount(this.properties.rowsVisible);
              }

          }



    // ---------------   "custom" methods of the widget --------------------------------

      //SAC method
      addRow(NewRow){
              //here we get the new fields from SAC -> all fields are filled
              var channelNewRow   = NewRow.l1;   //-> Top Node, Channel
              var channelNewRowID = NewRow.l1Id;

              var lh4NewRow = NewRow.l2;   //-> Second Level, LH4
              var lh4NewRowID = NewRow.l2Id;   //-> Second Level, LH4
              var lh4AFlag =  NewRow.l2Flag_a;
              var lh4BFlag =  NewRow.l2Flag_b;

              var mplNewRow = NewRow.l3;   //-> MPL, details
              var mplNewRowID = NewRow.l3Id;   //-> MPL, details
              var splAFlagNewRow = NewRow.flag_a;   //-> SPL flag (X = true/ "" = false)
              var splBFlagNewRow = NewRow.flag_b;   //-> SPL flag (X = true/ "" = false)

              var lh4AEnabled = NewRow.l2Flag_a_enabled;
              var lh4BEnabled = NewRow.l2Flag_b_enabled;

              var lh4AFlagEnabled = true;
              if ( lh4AEnabled !== "X" ) { lh4AFlagEnabled = false; }

              var lh4BFlagEnabled = true;
              if ( lh4BEnabled !== "X" ) { lh4BFlagEnabled = false; }

              var lh4AFlagBoolean = true;
              if ( lh4AFlag !== "X" ) { lh4AFlagBoolean = false; }

              var lh4BFlagBoolean = true;
              if ( lh4BFlag !== "X" ) { lh4BFlagBoolean = false; }


              //Map SPL Flag X to true or empty to false
              var splAFlagBoolean = true;
              if ( splAFlagNewRow === "X" ) { splAFlagBoolean = true; } else { splAFlagBoolean = false; }

              var splBFlagBoolean = true;
              if ( splBFlagNewRow === "X" ) { splBFlagBoolean = true; } else { splBFlagBoolean = false;  }


              var oTreeTable = window.globVar_UI5_Table;
              var oModel = oTreeTable.getModel();
              var oData = oModel.getData();
              var tableData = oData.spl;

              //First check highest level -> channel_index
              var channel_index = tableData.findIndex(function (line) {
                return line.name === channelNewRow;
              });

                if ( channel_index !== -1) {
                      //channel already exists
                        var channel_array = tableData[channel_index].spl;
                        var lh4_index = channel_array.findIndex(function (line) {
                          return line.name === lh4NewRow;
                        });

                        if ( lh4_index !== -1) {
                          var lh4_array = tableData[channel_index].spl[lh4_index].spl;
                          //existing LH4 -> only update flag
                            tableData[channel_index].spl[lh4_index].spl_flag_a    = lh4AFlagBoolean
                            tableData[channel_index].spl[lh4_index].spl_flag_b    = lh4BFlagBoolean;
                            tableData[channel_index].spl[lh4_index].flagEnabled_a = lh4AFlagEnabled;
                            tableData[channel_index].spl[lh4_index].flagEnabled_b = lh4BFlagEnabled;
                          
                            var mpl_index = lh4_array.findIndex(function (line) {
                            return line.name === mplNewRow;
                            });

                            if ( mpl_index !== -1) {
                              //existing MPL -> only update flag
                              tableData[channel_index].spl[lh4_index].spl[mpl_index].spl_flag_a = splAFlagBoolean;
                              tableData[channel_index].spl[lh4_index].spl[mpl_index].spl_flag_b = splBFlagBoolean;
                            } else {
                              //new MPL push into existing LH4
                              let mpl = {"name": mplNewRow, "id": mplNewRowID, "flagEnabled_a": true, "flagEnabled_b": true, "spl_flag_a": splAFlagBoolean, "spl_flag_b": splBFlagBoolean };
                              tableData[channel_index].spl[lh4_index].spl.push(mpl);
                            }

                        } else {
                          // new LH4 node added to existing channel
                          let mpl = [{"name": mplNewRow, "id": mplNewRowID, "flagEnabled_a": true, "flagEnabled_b": true, "spl_flag_a": splAFlagBoolean, "spl_flag_b": splBFlagBoolean }];
                          let lh4 = {"name": lh4NewRow, "id": lh4NewRowID,  "flagEnabled_a": lh4AFlagEnabled, "flagEnabled_b": lh4BFlagEnabled, "spl_flag_a": lh4AFlagBoolean, "spl_flag_b": lh4BFlagBoolean,"spl": mpl};
                          tableData[channel_index].spl.push(lh4);
                        }
                } else {
                      // new top node -> create all three levels
                      let mpl = [{"name": mplNewRow, "id": mplNewRowID, "flagEnabled_a": true, "flagEnabled_b": true, "spl_flag_a": splAFlagBoolean, "spl_flag_b": splBFlagBoolean }];
                      let lh4 = [{"name": lh4NewRow, "id": lh4NewRowID, "flagEnabled_a": lh4AFlagEnabled, "flagEnabled_b": lh4BFlagEnabled, "spl_flag_a": lh4AFlagBoolean, "spl_flag_b": lh4BFlagBoolean,"spl": mpl}];
                      let channel = {"name": channelNewRow, "id": channelNewRowID, "flagEnabled_a": false, "flagEnabled_b": false, "spl": lh4};
                      tableData.push(channel);
                }

            oModel.refresh();
      }

      //SAC method
      removeAllRows(){
        var TreeTable = window.globVar_UI5_Table;
        var oModel = TreeTable.getModel();
        oModel.oData = {spl: []};
        oModel.refresh();

        return "all rows are deleted.";

       }

      //SAC method
      getCheckBoxRow(){
        let checkBoxChangedObject = this.selectionState.checkBoxChanged;
        return checkBoxChangedObject ;
      }

      //SAC method
      getCheckBoxChanged(){
        let checkBoxChanged = this.selectionState.checkBoxColumn;
        return checkBoxChanged ;
      }


      // ---------------   other methods of the widget --------------------------------

      initializeUI5Component() {
        let content = document.createElement('div');
        content.slot = "content";
        this.appendChild(content);

        sap.ui.getCore().attachInit(function() {
            "use strict";

            sap.ui.loader.config( {
                paths: { 'com/evosight/sacwidgets/redbull': 'https://127.0.0.1:8080/' }
            } );

            //Require the controller class and all other dependencies
            sap.ui.require([
                              'com/evosight/sacwidgets/redbull/RBUI5TreeTable.controller'
                            ], function(RBUI5TreeTable) {
                                //Conteroller and dependecies are available

                                var oController = new RBUI5TreeTable();

                                oController.connectWidget(this);
                                this.controller = oController;

                                //Instantiate the view
                                //### THE APP: place the XMLView somewhere into DOM ###
                                var oView  = sap.ui.xmlview({
                                    viewName: 'com.evosight.sacwidgets.redbull.RBUI5TreeTable',
                                    controller: oController
                                });

                                //Place the view
                                oView.placeAt(content);

                                this.syncProperties();


              }.bind(this) );


          }.bind(this)
        );


      }




    }

    // ----------------END class Ui5CustTable extends HTMLElement----------------


    //Register custom element with tag name
    customElements.define("rb-sac-tree-table-ui5", Ui5TreeTable);





})();
