import {
  Button,
  Card,
  Form,
  FormLayout,
  Layout,
  Page,
  SettingToggle,
  Stack,
  TextField,
  TextStyle,
  DatePicker,
  Select, EmptyState,
  ResourceList,
  ResourceItem,
  Pagination,
  Modal,
  Filters,
  ChoiceList,
  TextContainer,
  Toast,
  Frame, Link, Spinner
} from '@shopify/polaris';
var _ = require('lodash');
var moment = require('moment');

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

class ThemeSchedules extends React.Component {
  state = {
    appActive: false,
    loadingAppLink: true,
    subscriptionLink: "",
    scheduleList: [],
    selectedItems: [],
    selectedItem: {},
    activeTheme: {},
    modalActive: false,
    modalContent: "",
    deployedStatus: null,
    pageQuery: 1,
    descriptionQuery: "",
    toastActive: false,
    toastContent: "",
    toastError: false,
    loadingSchedules: false
  };


  componentDidMount() {

    let appStatus = false;

    this.setState({ appActive: false, loadingAppLink: true }, async () => {

      const getAppStatus = await this.getAppStatus()
        .then(response => {

          appStatus = response;

          return this.getAccountInfo();
        })
        .then(({ account }) => {
          if (account !== undefined && account.storeAddress !== undefined && appStatus) {
            this.setState({ appActive: true });
            return true;
          } else {
            this.setState({ appActive: false });
            return false;
          }
        })
        .catch(error => {
          console.log(error);
          this.setState({ appActive: false });
          this.fetchFailed("Error getting app status")
        });

      if (getAppStatus === false) {
        const getSubscriptionLink = await this.getSubscriptionLink()
          .then(response => {
            this.setState({ appActive: false, loadingAppLink: false, subscriptionLink: response });
            return response;
          })
          .catch(error => {
            console.log(error);
            this.setState({ appActive: false });
            this.fetchFailed("Error getting app subscription plan url")
          });
      } else {
        this.fetchScheduleList();
      }

    });

  }

  render() {

    const { toastActive, toastContent, toastError, subscriptionLink, appActive, loadingAppLink } = this.state;

    const toastMarkup = toastActive ? (
      <Toast content={toastContent} error={toastError} onDismiss={this.toggleToastActive} />
    ) : null;

    const bulkActions = [
      {
        content: 'Delete schedules',
        onAction: () => this.deleteThemeSchedules(),
      },
    ];

    const filters = [
      {
        key: 'deployedStatus',
        label: 'Deployed status',
        filter: (
          <ChoiceList
            title="Deployed status"
            titleHidden
            choices={[
              {label: 'Deployed', value: 'yes'},
            ]}
            selected={this.state.deployedStatus || []}
            onChange={this.handleDeployedStatusChange}
            allowMultiple
          />
        ),
        shortcut: true,
      }
    ];

    const appliedFilters = [];

    if(!_.isEmpty(this.state.deployedStatus)) {
      const key = "deployedStatus";
      appliedFilters.push({
        key,
        label: this.disambiguateLabel(key, this.state.deployedStatus),
        onRemove: this.handleDeployedStatusRemove
      })
    }

    const filterControl = (
      <Filters
        filters={filters}
        appliedFilters={appliedFilters}
        focused={false}
        queryPlaceholder={"Search schedules by description"}
        queryValue={this.state.descriptionQuery}
        onQueryChange={this.onQueryChange}
        onQueryClear={this.onQueryClear}
        onClearAll={this.onClearAll}
        disabled={this.state.loadingSchedules}
      >
        <div style={{paddingLeft: '8px'}}>
          <Button
            primary
            disabled={this.state.loadingSchedules}
            onClick={this.searchByDescriptions}
          >
            Search Descriptions
          </Button>
        </div>
      </Filters>
    );

    const emptyStateScheduleList =
      !this.state.scheduleList.length ? (
        <EmptyState
          heading="Schedule a theme change to get started"
          action={{content: 'Schedule Theme Changes'}}
          image={img}
        >
          <p>Use theme commands page to schedule new changes to your website. Return here to view your scheduled changes.</p>
        </EmptyState>
      ) : undefined;

    const emptyLayout = subscriptionLink !== "" ? (
      <Layout>
        <Layout.AnnotatedSection
          title="Activate Subscription"
          description="Subscribe to the free trial or a paid plan to continue"
        >
          <Card sectioned>
            <div style={{ marginTop: '30px'}}>
              <Link url={subscriptionLink} monochrome={false} external={true}>
                <Button primary disabled={loadingAppLink}>
                  Click here to start app subscription
                </Button>
              </Link>
            </div>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    ) : null;

    const appLayout = (
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              loading={this.state.loadingSchedules}
              emptyState={emptyStateScheduleList}
              filterControl={filterControl}
              resourceName={{singular: 'schedule', plural: 'schedules'}}
              items={this.state.scheduleList}
              bulkActions={bulkActions}
              selectable
              selectedItems={this.state.selectedItems}
              onSelectionChange={this.setSelectedItems}
              renderItem={(item, index) => {
                const {id, description, scheduleAt, deployed, backupId} = item;

                return (
                  <ResourceItem
                    id={id}
                    key={deployed && index}
                    accessibilityLabel={`Scheduled change description: ${description}`}
                    verticalAlignment={"center"}
                  >
                    <Stack alignment="center">
                      <Stack.Item fill>
                        <h3>
                          <TextStyle variation="strong">{moment(scheduleAt).format("LLLL").toString()}</TextStyle>
                        </h3>
                        <div>{description}</div>
                        <div>Deployed: {deployed ? "Yes" : "No"}</div>
                      </Stack.Item>
                      <Stack.Item>
                        <Button primary onClick={() => { this.handleModalChange("deploySchedule", item) }}>Deploy Now</Button>
                      </Stack.Item>
                      <Stack.Item>
                        <Button onClick={() => { this.handleModalChange("restoreBackup", item) }}>Restore Backup</Button>
                      </Stack.Item>
                      <Stack.Item>
                        <Button destructive={true} onClick={() => { this.handleModalChange("deleteSchedule", item) }}>Delete Schedule</Button>
                      </Stack.Item>
                    </Stack>
                  </ResourceItem>
                );
              }}
            />
          </Card>
          <div style={{height: '100px', marginTop: '15px'}}>
            <Pagination
              hasPrevious={this.state.pageQuery > 1}
              previousKeys={[74]}
              previousTooltip="j"
              onPrevious={() => {
                this.handlePreviousPage();
              }}
              hasNext={this.state.scheduleList.length > 9}
              nextKeys={[75]}
              nextTooltip="k"
              onNext={() => {
                this.handleNextPage();
              }}
            />
          </div>
        </Layout.Section>
      </Layout>
    );

    return (
      <Frame>
        <Page>
          { appActive ? appLayout : emptyLayout }
          <Modal
            open={this.state.modalActive}
            onClose={this.handleModalChange}
            title="Confirm Action"
            primaryAction={{
              content: 'Confirm',
              onAction: this.handleActionConfirmation
            }}
            secondaryActions={[
              {
                content: 'Cancel',
                onAction: this.handleModalChange
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <p>
                  {this.state.modalContent}
                </p>
              </TextContainer>
            </Modal.Section>
          </Modal>
          {toastMarkup}
        </Page>
      </Frame>
    );
  }

  handleChange = (field) => {
    return (value) => this.setState({ [field]: value });
  };

  handleSubmit = () => {

    console.log('submit state', this.state);

  };

  handleActionConfirmation = () => {

    const { selectedItem, selectedAction } = this.state;

    if (selectedAction === "restoreBackup") {
      this.shortcutRestoreBackup(selectedItem.backupId);
    }

    if (selectedAction === "deploySchedule") {
      this.shortcutDeploySchedule(selectedItem);
    }

    if (selectedAction === "deleteSchedule") {
      this.shortcutDeleteSchedule(selectedItem.id);
    }

    this.setState({ modalActive: !this.state.modalActive });

  };

  handleModalChange = (action, item) => {

    if (item) {
      this.setState({ selectedItem: item });
      this.setState({ selectedAction: action });
    }

    if (action === "restoreBackup") {
      this.setState({ modalContent: "Confirm that you want to restore to this backup." });
    }

    if (action === "deploySchedule") {
      this.setState({ modalContent: "Confirm that you want to deploy the scheduled change now." });
    }

    if (action === "deleteSchedule") {
      this.setState({ modalContent: "Confirm that you want to delete to this schedule." });
    }

    this.setState({ modalActive: !this.state.modalActive });
  }

  shortcutDeploySchedule = async (scheduleItem) => {

    this.setState({ loadingSchedules: true }, async () => {
      const asset = {
        key: scheduleItem.fileKey,
        value: scheduleItem.fileValue
      }

      const response = await this.getThemeList()
        .then(json => {
          return this.findCurrentThemes(json);
        }).then(themesFound => {

          return this.updateThemeFile(asset);
        })
        .then(json => {

          let updatedScheduleItem = {
            id: scheduleItem.id,
            ownerId: scheduleItem.ownerId,
            deployed: true
          };

          this.setState({
            scheduleList: this.state.scheduleList.map(el => (el.id === scheduleItem.id ? {...el, deployed: true} : el))
          });

          return this.updateSchedule(updatedScheduleItem);
        })
        .then(response => {
          this.fetchSuccess("Successfully deployed!")
          return response;
        })
        .catch(error => {
          console.log(error);
          this.fetchFailed("Error deploying schedule")
        });
    });

  }

  updateSchedule = (schedule) => {

    const fetchURL = `/api/themes/schedule/update`;
    const options = {
      method: 'POST',
      body: JSON.stringify(schedule)
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => {
        return json;
      })
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error updating schedule")
      });
  }

  shortcutDeleteSchedule = (scheduleId) => {

    this.setState({ loadingSchedules: true },  () => {
      const { scheduleList } = this.state;

      const data = {
        scheduleId: scheduleId
      }

      const fetchURL = `/api/themes/schedule/delete`;
      const options = {
        method: 'POST',
        body: JSON.stringify(data)
      };

      fetch(fetchURL, options)
        .then(response => response.json())
        .then(json => {

          const newScheduleList = scheduleList.filter(schedule => schedule.id !== data.scheduleId);
          this.setState({ scheduleList: newScheduleList });

          this.fetchSuccess("Successfully deleted schedule!");

          return json;
        })
        .catch(error => {
          console.log(error);
          this.fetchFailed("Error deleting schedule")
        });
    });
  }

  getThemeList = () => {
    const fetchURL = `/api/themes`;
    const options = {
      method: 'GET'
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error getting theme list")
      });
  }

  findCurrentThemes = (json) => {

    let foundCurrentTheme = {};
    if (json.data.themes !== undefined) {
      var themes = json.data.themes;
      themes.forEach((theme) => {
        if (theme.role === "main") {
          foundCurrentTheme = theme;
        }
      })
    }

    this.setState({ activeTheme: foundCurrentTheme }, async () => {
      if(_.isEmpty(this.state.activeTheme)) {
        throw('Did not find active theme')
      }

      return true;
    });

    return true;
  }

  shortcutRestoreBackup = async (backupId) => {

    this.setState({ loadingSchedules: true }, async () => {
      const response = await this.getThemeList()
        .then(json => {
          return this.findCurrentThemes(json);
        }).then(themesFound => {

          return this.getBackupThemeFile(backupId);
        }).then(json => {
          const asset = {
            key: json.data.themeBackup.fileKey,
            value: json.data.themeBackup.fileValue
          }

          return this.updateThemeFile(asset);
        }).then(response => {
          this.fetchSuccess("Successfully restored backup!")
          return response;
        })
        .catch(error => {
          console.log(error);
          this.fetchFailed("Error restoring backup")
        });
    });

  }

  getBackupThemeFile = (id) => {
    return fetch(`/api/themes/${id}/backup`, {
      method: 'GET',
    }).then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error getting backup")
      });
  }

  updateThemeFile = (asset) => {

    const fetchURL = `/api/themes/${this.state.activeTheme.id}/config`;
    const options = {
      method: 'PUT',
      body: JSON.stringify({ asset })
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error saving staging theme name")
      });
  }

  setSelectedItems = (items) => {

    this.setState({
      selectedItems: items,
    });
  };

  deleteThemeSchedules = () => {

    this.setState({ loadingSchedules: true }, () => {
      const { selectedItems, scheduleList } = this.state;
      let errorCounter = 0;

      for (var i = 0; i < selectedItems.length; i++) {

        const data = {
          scheduleId: selectedItems[i]
        }

        const fetchURL = `/api/themes/schedule/delete`;
        const options = {
          method: 'POST',
          body: JSON.stringify(data)
        };

        fetch(fetchURL, options)
          .then(response => response.json())
          .then(json => {

            const newScheduleList = scheduleList.filter(schedule => schedule.id !== data.scheduleId);
            this.setState({
              scheduleList: newScheduleList
            });

            return json;
          })
          .catch(error => {
            errorCounter += 1;
            return error;
          });
      }

      if (errorCounter > 0) {
        this.fetchFailed(`Failed to delete ${errorCounter} schedules`);
      } else {
        this.fetchSuccess("Successfully deleted all schedules");
      }
    });

  }

  handleDeployedStatusChange = (value) => {
    this.setState({ deployedStatus: value, }, () => {
      this.fetchScheduleList();
    });
  }

  handleDeployedStatusRemove = () => {
    this.setState({ deployedStatus: null, }, () => {
      this.fetchScheduleList();
    });
  }

  disambiguateLabel = (key, value) => {
    switch (key) {
      case 'deployedStatus':
        return `Deployed: ${value}`
      default:
        return value;
    }
  }

  handlePreviousPage = () => {
    if (this.state.pageQuery > 1) {
      this.setState({ pageQuery: this.state.pageQuery - 1 }, () => {
        this.fetchScheduleList();
      });
    }
  }

  handleNextPage = () => {
    if (this.state.scheduleList.length >= 1) {
      this.setState({ pageQuery: this.state.pageQuery + 1 }, () => {
        this.fetchScheduleList();
      });
    }
  }

  onQueryChange = (queryValue) => {
    this.setState({
      descriptionQuery: queryValue,
    });
  }

  onQueryClear = () => {
    this.setState({ descriptionQuery: "" }, () => {
      this.fetchScheduleList();
    });
  }

  onClearAll = () => {
    this.setState({ descriptionQuery: "" }, () => {
      this.fetchScheduleList();
    });
  }

  searchByDescriptions = () => {
    if (this.state.descriptionQuery === "") {
      this.showToast("Enter text into search field", true);
    } else {
      this.fetchScheduleList();
    }
  }

  showToast = (text, error) => {
    this.setState({
      toastActive: !this.state.toastActive,
      toastContent: text,
      toastError: error
    });
  }

  toggleToastActive = () => {
    this.setState({
      toastActive: !this.state.toastActive,
    });
  }

  fetchScheduleList = () => {

    let deployed = "no";

    if (this.state.deployedStatus != null) {
      if (this.state.deployedStatus.length > 0) {
        deployed = "yes";
      }
    }

    let page = this.state.pageQuery;

    let description = this.state.descriptionQuery;

    let fetchURL = `/api/themes/schedules?page=${page}&deployed=${deployed}&description=${description}`;

    const options = {
      method: 'GET'
    };

    this.setState({ loadingSchedules: true }, () => {
      fetch(fetchURL, options)
        .then(response => response.json())
        .then(({themeSchedules}) => {

          this.setState({
            loadingSchedules: false,
            scheduleList: themeSchedules,
          });

        })
        .catch(error => {
          console.log(error);
          this.fetchFailed("Error fetching schedule list")
        });
    });

  }

  fetchFailed = (error) => {
    this.setState({
      loadingSchedules: false
    });
    this.showToast(error, true);
  }

  fetchSuccess = (message) => {
    this.setState({
      loadingSchedules: false
    });
    this.showToast(message, false);
  }

  getAppStatus = () => {
    const fetchURL = `/app/subs`;

    const options = {
      method: 'GET',
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => {

        let appActive = false;
        if (json.data !== undefined) {
          var subscriptions = json.data;
          console.log('subscriptions', subscriptions)
          subscriptions.forEach((subscription) => {
            if (subscription.status === 'ACTIVE' || subscription.status === 'ACCEPTED') {
              appActive = true;
            }
          })
        }

        return appActive;
      })
      .catch(error => {
        console.log(error);
        this.setState({ appActive: false });
        this.fetchFailed("Couldn't find app subscription status")
      });
  }

  getAccountInfo = () => {
    const fetchURL = `/api/account/info`;

    const options = {
      method: 'GET'
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => {
        return json;
      })
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error getting account info")
      });
  }


  getSubscriptionLink = () => {
    const fetchURL = `/app/sublink`;

    const options = {
      method: 'GET',
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => {

        return json.data;
      })
      .catch(error => {
        console.log(error);
        this.setState({ appActive: false });
        this.fetchFailed("Couldn't find app subscription plan url")
      });
  }

}

export default ThemeSchedules;