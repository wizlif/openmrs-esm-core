import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  InlineLoading,
  InlineNotification,
  PasswordInput,
  TextInput,
  Tile,
  ComboBox,
  Grid,
  Column,
} from "@carbon/react";
import { EarthFilled, PhoneFilled } from "@carbon/react/icons";
import { useTranslation } from "react-i18next";
import {
  useConfig,
  interpolateUrl,
  useSession,
  refetchCurrentUser,
  clearCurrentUser,
  getSessionStore,
  useConnectivity,
} from "@openmrs/esm-framework";
import { performLogin } from "../login.resource";
import locationsTestData from "./locations";
import styles from "./login.scss";

const hidden: React.CSSProperties = {
  height: 0,
  width: 0,
  border: 0,
  padding: 0,
};

export interface LoginReferrer {
  referrer?: string;
}

export interface LoginProps extends LoginReferrer {}

const Login: React.FC<LoginProps> = () => {
  const config = useConfig();
  const isLoginEnabled = useConnectivity();
  const { t } = useTranslation();
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const showPassword = location.pathname === "/login/confirm";

  useEffect(() => {
    if (user) {
      clearCurrentUser();
      refetchCurrentUser().then(() => {
        const authenticated =
          getSessionStore().getState().session.authenticated;
        if (authenticated) {
          navigate("/login/location", { state: location.state });
        }
      });
    } else if (!username && location.pathname === "/login/confirm") {
      navigate("/login", { state: location.state });
    }
  }, [username, navigate, location, user]);

  useEffect(() => {
    if (!user && config.provider.type === "oauth2") {
      const loginUrl = config.provider.loginUrl;
      window.location.href = loginUrl;
    }
  }, [config, user]);

  const filterLocationNames = (name) => {
    return name?.item?.toLowerCase().includes(name?.inputValue?.toLowerCase());
  };

  const changeUsername = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setUsername(evt.target.value),
    []
  );

  const changePassword = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setPassword(evt.target.value),
    []
  );

  const resetUserNameAndPassword = useCallback(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      try {
        setIsLoggingIn(true);
        const loginRes = await performLogin(username, password);
        const authData = loginRes.data;
        const valid = authData && authData.authenticated;

        if (valid) {
          navigate("/login/location", { state: location.state });
        } else {
          throw new Error("invalidCredentials");
        }
      } catch (error) {
        setIsLoggingIn(false);
        setErrorMessage(error.message);
        resetUserNameAndPassword();
      }

      return false;
    },

    [
      showPassword,
      username,
      password,
      navigate,
      location.state,
      resetUserNameAndPassword,
    ]
  );

  const handleLocationChange = (selectedItem) => {
    setSelectedLocation(selectedItem);
  };

  const logo = config.logo.src ? (
    <img
      src={interpolateUrl(config.logo.src)}
      alt={config.logo.alt}
      className={styles["logo-img"]}
    />
  ) : (
    <svg role="img" className={styles["logo"]}>
      <title>OpenMRS logo</title>
      <use xlinkHref="#omrs-logo-full-color"></use>
    </svg>
  );

  if (config.provider.type === "basic") {
    return (
      <div className={`canvas ${styles["container"]}`}>
        {errorMessage && (
          <InlineNotification
            className={styles.errorMessage}
            kind="error"
            /**
             * This comment tells i18n to still keep the following translation keys (used as value for: errorMessage):
             * t('invalidCredentials')
             */
            subtitle={t(errorMessage)}
            title={t("error", "Error")}
            onClick={() => setErrorMessage("")}
          />
        )}
        <Tile className={styles["login-card"]}>
          <Grid>
            <Column sm={4} lg={8}>
              <div>{logo}</div>
            </Column>
            <Column sm={4} lg={8}>
              <form onSubmit={handleSubmit} ref={formRef}>
                <div className={styles["input-group-custom"]}>
                  <h4 className={styles["login-text"]}>Login</h4>
                  <div className={styles["input-container"]}>
                    <label
                      htmlFor="username"
                      className={styles["input-container-label"]}
                    >
                      {t("username", "Username")}
                    </label>
                    <TextInput
                      id="username"
                      type="text"
                      name="username"
                      value={username}
                      onChange={changeUsername}
                      ref={usernameInputRef}
                      autoFocus
                      required
                    />
                  </div>
                  <div className={styles["input-container"]}>
                    <label
                      htmlFor="password"
                      className={styles["input-container-label"]}
                    >
                      {t("password", "Password")}
                    </label>
                    <PasswordInput
                      id="password"
                      invalidText={t(
                        "validValueRequired",
                        "A valid value is required"
                      )}
                      name="password"
                      value={password}
                      onChange={changePassword}
                      ref={passwordInputRef}
                      required
                      showPasswordLabel="Show password"
                    />
                  </div>

                  <div className={styles["input-container"]}>
                    <label
                      htmlFor="location"
                      className={styles["input-container-label-combo"]}
                    >
                      {t("location", "Location")}
                    </label>
                    <ComboBox
                      ariaLabel="Location"
                      id="resources-dropdown"
                      items={
                        locationsTestData
                          ? locationsTestData.map(
                              (entry) => entry.resource.name
                            )
                          : []
                      }
                      shouldFilterItem={filterLocationNames}
                      onChange={handleLocationChange}
                      style={{ width: "18rem" }}
                      required
                    />
                  </div>
                  <div className={styles["input-container"]}>
                    <div className={styles["cant-login-text"]}>
                      {t("cantLogin", "Can't Login?")}
                    </div>
                    <div>
                      <Button
                        type="submit"
                        size="sm"
                        className={styles.continueButton}
                        disabled={!isLoginEnabled || isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <InlineLoading
                            className={styles.loader}
                            description={t("loggingIn", "Logging in") + "..."}
                          />
                        ) : (
                          <div>
                            <span>{t("login", "Log in")}</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className={styles["login-card-footer"]}>
                    <div className={styles["login-card-footer-content"]}>
                      {" "}
                      <EarthFilled
                        className={styles["login-card-footer-icon"]}
                      />{" "}
                      {t("visitPortal", "Visit Portal")}{" "}
                    </div>
                    <div style={{ flex: "auto" }}>|</div>
                    <div
                      className={styles["login-card-footer-content"]}
                      style={{ flex: "initial" }}
                    >
                      {" "}
                      <PhoneFilled
                        className={styles["login-card-footer-icon"]}
                      />{" "}
                      {t("contactSupport", "Contact Support")}
                    </div>
                  </div>
                </div>
              </form>
            </Column>
          </Grid>
        </Tile>
        <div className={styles["footer"]}>
          <Tile className={styles["powered-by-card"]}>
            <div className={styles["powered-by-txt"]} style={{ flex: "auto" }}>
              &copy;
              {t("2023AllRightsReserved", "2023 All Rights Reserved")}
              <span className={styles["text-color-red"]}>
                {" "}
                {t(
                  "MinistryOfHealth",
                  "Ministry of Health - Republic of Uganda"
                )}
              </span>
            </div>
            <div className={styles["powered-by-txt"]}>
              {" "}
              {t("poweredBy", "Powered by")}:{" "}
              <span className={styles["text-color-red"]}>
                {" "}
                {t("METSProgram", "MakSPH- METS Program")}
              </span>{" "}
              | Ver 4.0.0
            </div>
          </Tile>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;
