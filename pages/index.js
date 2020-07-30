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
  Select,
  Frame,
  Toast,
  Heading,
  TextContainer,
  ButtonGroup,
  Spinner,
  Link,
  DisplayText,
  DescriptionList
} from '@shopify/polaris';
var _ = require('lodash');

class ThemeCommands extends React.Component {
  state = {
    appActive: false,
    loadingAppLink: true,
    subscriptionLink: "",
    toastActive: false,
    toastContent: "",
    toastError: false,
    loadingScheduleSubmit: false,
    loadingThemeUpdate: false,
    loadingThemeSettings: false,
    activeTheme: {},
    stagingThemeName: '',
    stagingThemeNameLength: 0,
    stagingTheme: {},
    selectedDate: new Date(),
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    selectedHour: '00',
    selectedMinute: '00',
    scheduleDescription: "",
    scheduleDescriptionLength: 0,
    hourOptions: [
      { label: '12 am', value: '00' },
      { label: '1 am', value: '01' },
      { label: '2 am', value: '02' },
      { label: '3 am', value: '03' },
      { label: '4 am', value: '04' },
      { label: '5 am', value: '05' },
      { label: '6 am', value: '06' },
      { label: '7 am', value: '07' },
      { label: '8 am', value: '08' },
      { label: '9 am', value: '09' },
      { label: '10 am', value: '10' },
      { label: '11 am', value: '11' },
      { label: '12 pm', value: '12' },
      { label: '1 pm', value: '13' },
      { label: '2 pm', value: '14' },
      { label: '3 pm', value: '15' },
      { label: '4 pm', value: '16' },
      { label: '5 pm', value: '17' },
      { label: '6 pm', value: '18' },
      { label: '7 pm', value: '19' },
      { label: '8 pm', value: '20' },
      { label: '9 pm', value: '21' },
      { label: '10 pm', value: '22' },
      { label: '11 pm', value: '23' },
    ],
    minuteOptions: [
      { label: '00', value: '00' },
      { label: '15', value: '15' },
      { label: '30', value: '30' },
      { label: '45', value: '45' },
    ],
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
        this.startApp();
      }

    });

  }

  render() {

    const { appActive, subscriptionLink, loadingAppLink, toastActive, toastContent, toastError, activeTheme, stagingTheme } = this.state;

    const toastMarkup = toastActive ? (
      <Toast content={toastContent} error={toastError} onDismiss={this.toggleToastActive} />
    ) : null;

    const { stagingThemeName, selectedDate, minuteOptions, hourOptions, selectedMinute, selectedHour, scheduleDescription } = this.state;
    const today = new Date()
    const yesterday = new Date(today)

    yesterday.setDate(yesterday.getDate() - 1)

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
        <Card sectioned>
          <DisplayText size="large" element="p">Setup Instructions</DisplayText>
          <Heading style={{ paddingBottom: '15px' }}>Let's get started by following this guide</Heading>

          <DescriptionList
            items={[
              {
                term: 'Step 1',
                description:
                  'Duplicate your live theme and rename it with a recommended prefix "Staging-".',
              },
              {
                term: 'Step 2',
                description:
                  'Make a change in the duplicated theme. This is the"Customize" option in your staging theme.',
              },
              {
                term: 'Step 3',
                description:
                  'In the app under "Theme Commands" tab, add the staging theme name and click the save settings button. There will be messaging included whether the theme is found or not.',
              },
              {
                term: 'Step 4',
                description:
                  'Then choose a date and time for the settings to be changed on the calendar section. Add a description of your update and submit your change. If you want to test drive the app, choose the closest time.',
              },
              {
                term: 'Step 5',
                description:
                  'Updates will appear on your live theme on the scheduled time.',
              },
            ]}
          />

        </Card>
        <Layout.AnnotatedSection
          title="Theme Settings"
          description="Duplicate your theme and rename it. Go to 'Online Store' -> 'Themes' then click the 'Actions' dropdown on your live theme and select 'Duplicate'. When complete, we recommended renaming the duplicated theme with 'Staging-' as a prefix. Then add it here under 'Staging Theme Name'. This is the theme where you will be updating and scheduling changes from. * Make sure the name is unique from other theme names *"
        >
          <Card sectioned>
            <TextContainer>
              <p><strong>Active Theme Name:</strong> {this.state.loadingThemeSettings ? <Spinner accessibilityLabel="Loading Theme Settings" size="small" color="teal" /> : !_.isEmpty(activeTheme) ? activeTheme.name : <TextStyle variation="negative">Theme not found</TextStyle>}</p>
              <p><strong>Staging Theme:</strong> {this.state.loadingThemeSettings ? <Spinner accessibilityLabel="Loading Theme Settings" size="small" color="teal" /> : !_.isEmpty(stagingTheme) ? <TextStyle variation="positive">Theme found</TextStyle> : <TextStyle variation="negative">Theme not found</TextStyle>}</p>
            </TextContainer>
            <div style={{ marginTop: '30px'}}>
              <Form onSubmit={this.handleSubmit}>
                <FormLayout>
                  <TextField
                    value={stagingThemeName}
                    label={"Staging Theme Name (" + this.state.stagingThemeNameLength + "/150)"}
                    type="text"
                    onChange={value => this.handleStagingThemeName(value)}
                  />
                  <Stack distribution="trailing">
                    <Button primary submit>
                      Save Settings
                    </Button>
                  </Stack>
                </FormLayout>
              </Form>
            </div>
          </Card>
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          title="Schedule a date and time for the settings to be changed/updated"
          description="Make sure you have reviewed your changes before scheduling a change. Your staging theme settings will be saved in it's current state and updated at the scheduled time. A backup of your active theme is made and tied to the schedule you make. Check the 'Theme Schedules' tab to view your scheduled changes."
        >
          <Card sectioned>
            <Form onSubmit={this.handleScheduleSubmit}>
              <FormLayout>
                <DatePicker
                  month={this.state.selectedMonth}
                  onMonthChange={this.handleChange('selectedMonth')}
                  year={this.state.selectedYear}
                  onChange={this.handleChange('selectedDate')}
                  selected={selectedDate}
                  allowRange={false}
                  disableDatesBefore={yesterday}
                />
                <FormLayout.Group>
                  <Select
                    label="Hour"
                    options={hourOptions}
                    onChange={this.handleChange('selectedHour')}
                    value={selectedHour}
                  />
                  <Select
                    label="Minute"
                    options={minuteOptions}
                    onChange={this.handleChange('selectedMinute')}
                    value={selectedMinute}
                  />
                </FormLayout.Group>
                <TextField
                  value={scheduleDescription}
                  onChange={value => this.handleScheduleDescription(value)}
                  label={"Scheduled change description (" + this.state.scheduleDescriptionLength + "/150)" }
                  type="text"
                />
                <Stack distribution="trailing">
                  <Button primary loading={this.state.loadingScheduleSubmit} submit>
                    Save
                  </Button>
                </Stack>
              </FormLayout>
            </Form>
          </Card>
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          title="Update Now"
          description="Update changes on your staging theme to the live theme."
        >
          <Form onSubmit={this.handleThemeUpdate}>
            <FormLayout>
              <Stack alignment="trailing" vertical={true}>
                <TextStyle variation="strong">Make sure any upcoming schedules are deleted before updating to prevent an overwrite.</TextStyle>
                <Button loading={this.state.loadingThemeUpdate} primary submit>
                  Update Theme Now
                </Button>
              </Stack>
            </FormLayout>
          </Form>
        </Layout.AnnotatedSection>
      </Layout>
    );

    return (
      <Frame>
        <Page>
          { appActive ? appLayout : emptyLayout }
          {toastMarkup}
        </Page>
      </Frame>
    );
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

  startApp = () => {
    this.setState({ loadingThemeSettings: true }, async () => {
      const response = await this.getStagingThemeName()
        .then(() => {
          if (this.state.stagingThemeName === "" && !_.isEmpty(this.state.activeTheme)) {
            this.setState({
              stagingThemeName: "Staging-" + this.state.activeTheme.name
            });
          }
          return this.getThemeSettings();
        })
        .catch(error => {
          console.log(error);
          this.setState({ loadingThemeSettings: false });
          this.fetchFailed("Error starting app")
        });
    });
  }

  getThemeSettings = () => {
    this.setState({ loadingThemeSettings: true }, async () => {

      const response = await this.getThemeList()
        .then(json => {
          return this.findThemeSettings(json);
        }).then(themesFound => {

          this.setState({
            loadingThemeSettings: false
          });
        })
        .catch(error => {
          console.log(error);
          this.setState({
            loadingThemeSettings: false
          });
          this.fetchFailed("Error finding theme settings")
        });
    });
  };

  findThemeSettings = (json) => {

    const { stagingThemeName } = this.state;

    this.setState({ stagingTheme: {} }, async () => {
      let stagingThemeFound = {};
      let activeThemeFound = {};

      if (json.data.themes !== undefined) {
        var themes = json.data.themes;
        themes.forEach((theme) => {
          if (theme.name === stagingThemeName) {
            stagingThemeFound = theme;
          }

          if (theme.role === "main") {
            activeThemeFound = theme;
          }
        })
      }

      this.setState({ stagingTheme: stagingThemeFound, activeTheme: activeThemeFound }, async () => {
        if (_.isEmpty(this.state.stagingTheme) ) {
          throw ('Did not find staging theme');
        }

        if(_.isEmpty(this.state.activeTheme)) {
          throw ('Did not find active theme');
        }
        return true;
      });

      return true
    });
  }

  handleSubmit = () => {

    this.setState({ loadingThemeSettings: true, stagingThemeName: this.state.stagingThemeName }, async () => {
      const response = await this.getThemeList()
        .then(json => {
          return this.findThemeSettings(json);
        }).then(themesFound => {

          return this.saveStagingThemeName();
        }).then( () => {
          this.setState({
            loadingThemeSettings: false
          });
        })
        .catch(error => {
          console.log(error);
          this.setState({
            loadingThemeSettings: false
          });
          this.fetchFailed("Error submitting theme settings")
        });
    });

  };

  saveStagingThemeName = () => {
    const fetchURL = `/api/account/staging`;

    const data = {
      stagingThemeName: this.state.stagingThemeName
    }

    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error saving staging theme name")
      });
  }

  getStagingThemeName = () => {
    const fetchURL = `/api/account/staging`;

    const options = {
      method: 'GET',
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => {
        this.setState({
          stagingThemeName: json.stagingThemeName
        });
        return json;
      })
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error getting staging theme name")
      });
  }

  handleScheduleDescription = (value) => {
    if (value.length > 150) {
      this.fetchFailed("Description limit is 150 characters.")
    } else {
      this.setState({
        scheduleDescription: value,
        scheduleDescriptionLength: value.length
      });
    }
  };

  handleStagingThemeName = (value) => {
    if (value.length > 150) {
      this.fetchFailed("Theme name limit is 150 characters.")
    } else {
      this.setState({
        stagingThemeName: value,
        stagingThemeNameLength: value.length
      });
    }
  };

  handleScheduleSubmit = async () => {

    this.setState({ loadingScheduleSubmit: true }, async () => {
      const { selectedDate, selectedMonth, selectedYear, selectedHour, selectedMinute, scheduleDescription } = this.state;

      var dateRetrieved, scheduleBackupId;

      if (selectedDate.start) {
        dateRetrieved = selectedDate.start;
      } else {
        dateRetrieved = selectedDate;
      }


      var scheduledDay = new Date(selectedYear, selectedMonth, dateRetrieved.getDate(), selectedHour, selectedMinute);

      var now = new Date();

      if (scheduledDay < now) {
        this.setState({
          loadingScheduleSubmit: false
        });
        this.fetchFailed("Scheduled time has passed. Pick new time.")
        return false;
      }

      const response = await this.getThemeList()
        .then(json => {
          return this.findCurrentThemes(json);
        }).then(themesFound => {

          return this.getThemeFileById(this.state.activeTheme.id);
        }).then(json => {
          const asset = {
            key: json.data.asset.key,
            value: json.data.asset.value
          }

          return this.backupThemeFile({ themeId: json.data.themeId, data: asset });
        }).then(({ data }) => {

          scheduleBackupId = data.themeBackup.id;

          return this.getThemeFileById(this.state.stagingTheme.id);
        }).then(json => {
          const asset = {
            key: json.data.asset.key,
            value: json.data.asset.value
          }

          return this.scheduleThemeFile({ date: scheduledDay.toISOString(), backupId: scheduleBackupId, asset, description: scheduleDescription });
        }).then(() => {
          this.setState({
            scheduleDescription: "",
            loadingScheduleSubmit: false
          });
          this.fetchSuccess("Successfully scheduled change!")
          return true;
        })
        .catch(error => {
          this.setState({
            loadingScheduleSubmit: false
          });

          console.log(error);
          this.fetchFailed("Error submitting schedule")
        });
    });

  };

  findCurrentThemes = (json) => {
    const { stagingThemeName } = this.state;
    let stagingThemeFound = {};
    let activeThemeFound = {};

    if (json.data.themes !== undefined) {
      var themes = json.data.themes;
      themes.forEach((theme) => {
        if (theme.name === stagingThemeName) {
          stagingThemeFound = theme;
        }

        if (theme.role === "main") {
          activeThemeFound = theme;
        }
      })
    }

    this.setState({ stagingTheme: stagingThemeFound, activeTheme: activeThemeFound }, async () => {
      if (_.isEmpty(this.state.stagingTheme) ) {
        throw ('Did not find staging theme');
      }

      if(_.isEmpty(this.state.activeTheme)) {
        throw ('Did not find active theme');
      }
      return true;
    });

    return true;
  }

  handleThemeUpdate = async () => {

    this.setState({ loadingThemeUpdate: true }, async () => {
      const { stagingThemeName } = this.state;

      const response = await this.getThemeList()
        .then(json => {
          return this.findCurrentThemes(json);
        }).then(themesFound => {

          return this.getThemeFileById(this.state.stagingTheme.id);
        }).then(json => {
          const asset = {
            key: json.data.asset.key,
            value: json.data.asset.value
          }
          return this.updateThemeFile(asset);
        }).then(() => {
          this.setState({
            loadingThemeUpdate: false
          });
          this.fetchSuccess("Successfully updated live theme!")
        })
        .catch(error => {
          this.setState({
            loadingThemeUpdate: false
          });
          console.log(error);
          this.fetchFailed("Error handling theme update")
        });
    });

  };

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

  getThemeFileById = (id) => {
    return fetch(`/api/themes/${id}/config`, {
      method: 'GET',
    }).then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error getting theme file")
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
        this.fetchFailed("Error updating theme file")
      });
  }

  backupThemeFile = ({ themeId, data }) => {

    const fetchURL = `/api/themes/${themeId}/backup`;
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error backing up theme file")
      });
  }

  scheduleThemeFile = (schedule) => {

    const fetchURL = `/api/themes/${this.state.stagingTheme.id}/schedule`;
    const options = {
      method: 'POST',
      body: JSON.stringify(schedule)
    };

    return fetch(fetchURL, options)
      .then(response => response.json())
      .then(json => json)
      .catch(error => {
        console.log(error);
        this.fetchFailed("Error scheduling theme")
      });
  }

  handleChange = (field) => {
    return (value) => this.setState({ [field]: value });
  };

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

  fetchFailed = (error) => {
    this.showToast(error, true);
  }

  fetchSuccess = (message) => {
    this.showToast(message, false);
  }

}

export default ThemeCommands;